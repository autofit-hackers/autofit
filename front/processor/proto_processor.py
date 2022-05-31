import copy
from http import server
import json
import os
import pickle
import re
import time
from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union

import av
import cv2
import mediapipe as mp
import numpy as np
from PIL import Image
from apps.pose3d_reconstruction import reconstruct_pose_3d
from streamlit_webrtc import VideoProcessorBase
from ui_components.video_widget import ResetButton
from utils import FpsCalculator, PoseLandmarksObject, draw_landmarks_pose, mp_res_to_pose_obj
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, RepState, SaveStates
from utils.display_objects import CoachPose, Instruction_Old_ForMitouAD
from utils.draw_pose import draw_joint_angle_2d
from utils.video_recorder import create_video_writer, release_video_writer

_SENTINEL_ = "_SENTINEL_"


def pose_process(in_queue: Queue, out_queue: Queue, model_settings: ModelSettings) -> None:
    mp_pose = mp.solutions.pose  # type: ignore
    # XXX: ぶっ壊れてる可能性
    pose = mp_pose.Pose(
        model_complexity=model_settings.model_complexity,
        min_detection_confidence=model_settings.min_detection_confidence,
        min_tracking_confidence=model_settings.min_tracking_confidence,
    )

    while True:
        try:
            input_item = in_queue.get(timeout=10)
            outqueue_timestamp: float = time.time()
        except Exception as e:
            continue

        if isinstance(input_item, type(_SENTINEL_)) and input_item == _SENTINEL_:
            break

        results = pose.process(input_item)
        # NOTE: 検出失敗時の例外処理をシンプルにできないか
        # NOTE: resultsっていう変数名分かりにくくね?
        if results.pose_landmarks is None:
            out_queue.put_nowait(None)
            continue

        out_queue.put_nowait(mp_res_to_pose_obj(results, timestamp=outqueue_timestamp))


class PrototypeProcessor(VideoProcessorBase):
    def __init__(
        self,
        model_settings: ModelSettings,
        is_saving: bool,
        display_settings: DisplaySettings,
        rep_count_settings: RepCountSettings,
        training_mode: str,
        uploaded_pose_file=None,
        uploaded_instruction_file=None,
        is_clicked_reset_button: bool = False,
        video_save_path: Union[str, None] = None,
        pose_save_path: Union[str, None] = None,
    ) -> None:
        self._in_queue = Queue()
        self._out_queue = Queue()
        self._pose_process = Process(
            target=pose_process,
            kwargs={
                "in_queue": self._in_queue,
                "out_queue": self._out_queue,
                "model_settings": model_settings,
            },
        )
        self._FpsCalculator = FpsCalculator(buffer_len=10)  # XXX: buffer_len は 10 が最適なのか？

        self.model_settings = model_settings
        self.is_saving = is_saving
        self.display_settings = display_settings
        self.rep_count_settings = rep_count_settings

        self.is_clicked_reset_button = is_clicked_reset_button

        self.video_save_path = video_save_path
        self.video_writer: Union[cv2.VideoWriter, None] = None

        self.pose_save_path: Union[str, None] = pose_save_path
        self.pose_memory: List[PoseLandmarksObject] = []

        self.rep_state: RepState = RepState()
        self.coaching_contents: List[str] = []

        self.coach_pose = CoachPose()
        if uploaded_pose_file:
            self.coach_pose.set_coach_pose(uploaded_pose_file=uploaded_pose_file)
        self.instruction = Instruction_Old_ForMitouAD()

        if uploaded_instruction_file:
            img = Image.open(uploaded_instruction_file)
            self.instruction_file = np.array(img)
        else:
            self.instruction_file = np.array([[[1, 1, 1, 1]]])

        self.training_mode = training_mode
        self.penguin_count = 300

        self.reset_button = ResetButton()

        self._pose_process.start()

    # NOTE: infer or estimate で用語統一する?
    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_pose(self):
        assert self.pose_save_path is not None
        print(f"Saving {len(self.pose_memory)} pose frames to {self.pose_save_path}")
        os.makedirs(os.path.dirname(self.pose_save_path), exist_ok=True)
        with open(self.pose_save_path, "wb") as f:
            pickle.dump(self.pose_memory, f, protocol=pickle.HIGHEST_PROTOCOL)

    # TODO: auto-reconstruction when save pose
    def _reconstruct_pose_3d(self):
        assert self.pose_save_path is not None
        pose_dir = os.path.dirname(self.pose_save_path)
        if os.path.isfile(f"{pose_dir}/front.pkl") and os.path.isfile(f"{pose_dir}/side.pkl"):
            return

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        recv_timestamp: float = time.time()
        display_fps = self._FpsCalculator.get()

        frame = frame.to_ndarray(format="bgr24")
        frame = cv2.flip(frame, 1)  # ミラー表示
        # TODO: ここで image に対して single camera calibration
        if self.display_settings.rotate_webcam_input:
            frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(frame)

        # 検出実施 #############################################################
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result_pose: PoseLandmarksObject = self._infer_pose(frame)
        self.reset_button.visualize(frame=processed_frame)

        if self.display_settings.show_2d and result_pose:

            # セットの最初にリセットする
            # TODO: 今はボタンがトリガーだが、ゆくゆくは声などになる
            if self.reset_button.is_pressed(processed_frame, result_pose):
                self.rep_state = self.coach_pose._reset_training_set(
                    realtime_pose=result_pose, rep_state=self.rep_state
                )
                self.is_clicked_reset_button = False
                self.instruction.update_knee_y(pose=result_pose, frame_height=processed_frame.shape[0])
                self.penguin_count = 90

            if self.rep_count_settings.do_count_rep:
                # レップカウントを更新
                assert self.rep_count_settings.upper_thresh is not None
                assert self.rep_count_settings.lower_thresh is not None
                self.rep_state.update_rep_count(
                    pose=result_pose,
                    upper_thre=self.rep_count_settings.upper_thresh,
                    lower_thre=self.rep_count_settings.lower_thresh,
                )

            # キーフレームを検出してフレームをリロード
            if self.rep_state.is_keyframe(pose=result_pose):
                self.coach_pose._reload_pose()
                color = (0, 0, 255)
            else:
                color = (255, 0, 0)

            # Poseの描画 ################################################################
            if result_pose.landmark is not None:
                processed_frame = draw_landmarks_pose(processed_frame, result_pose, pose_color=color, show_z=False)
                if self.training_mode == "Penguin" and self.penguin_count > 0:
                    self.penguin_count -= 1
                elif self.training_mode == "Penguin" and self.penguin_count == 0:
                    color = (0, 0, 255)
                    processed_frame = draw_landmarks_pose(processed_frame, result_pose, pose_color=color, show_z=False)
                elif self.training_mode == "JointAngle":
                    processed_frame = draw_joint_angle_2d(processed_frame, result_pose)

            # お手本Poseの描画
            if self.coach_pose.uploaded_frames and self.coach_pose.loaded_frames is not None:
                processed_frame = self.coach_pose._show_loaded_pose(processed_frame)

            # 指導
            if self.rep_state.rep_count >= 1 and self.training_mode == "Training":
                line_color = self.instruction.check_pose(pose=result_pose, frame_height=processed_frame.shape[0])
                frame = self.instruction.show_instruction_image(
                    frame=processed_frame, line_color=line_color, instruction_image=self.instruction_file
                )
                # self.instruction._proceed_frame()

            # self._update_realtime_coaching(result_pose)

        # pose の保存 (pose_mem への追加) ########################################################
        if self.is_saving and self.pose_save_path is not None:
            self.pose_memory.append(
                result_pose
                if result_pose
                else PoseLandmarksObject(
                    landmark=np.zeros(shape=(33, 3)), visibility=np.zeros(shape=(33, 1)), timestamp=recv_timestamp
                )
            )  # NOTE: ビデオのフレームインデックスとposeのフレームインデックスを一致させるために、2D Pose Estimation ができなかった場合は zero padding

        # pose の保存（書き出し）
        if (len(self.pose_memory) > 0) and (not self.is_saving):
            self._save_pose()
            # self._reconstruct_pose_3d
            self.pose_memory = []

        # Show rep count
        if self.rep_count_settings.do_count_rep:
            cv2.putText(
                processed_frame,
                f"Rep:{self.rep_state.rep_count}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

        # Show fps
        if self.display_settings.show_fps:
            cv2.putText(
                processed_frame,
                "FPS:" + format(display_fps, ".0f"),
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, max(min(display_fps - 20, 10) * 25.5, 0), 255 - max(min(display_fps - 20, 10) * 25.5, 0)),
                2,
                cv2.LINE_AA,
            )

        # Visualize reset button
        self.reset_button.visualize(processed_frame)

        # 動画の保存
        if self.is_saving:
            # 初期化
            if self.video_writer is None:
                assert self.video_save_path is not None
                frame_to_save = av.VideoFrame.from_ndarray(frame, format="rgb24")
                self.video_writer = create_video_writer(
                    fps=30, frame=frame_to_save, video_save_path=self.video_save_path
                )
                print(f"initialized video writer to save {self.video_save_path}")
            # 動画の保存（フレームの追加）
            self.video_writer.write(processed_frame)

        # 動画の保存（writerの解放）
        if (not self.is_saving) and (self.video_writer is not None):
            release_video_writer(video_writer=self.video_writer, video_save_path=self.video_save_path)

        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
