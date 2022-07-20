import copy
import os
import pickle
import time
from multiprocessing import Process, Queue
from typing import List, Union

import av
import cv2
from lib.pose.training_set import RepState
import mediapipe as mp
import numpy as np
from apps.pose3d_reconstruction import reconstruct_pose_3d
from streamlit_webrtc import VideoProcessorBase
from utils import FpsCalculator, PoseLandmarksObject, draw_landmarks_pose, mp_res_to_pose_obj
import lib.streamlit_ui.setting_class as settings

_SENTINEL_ = "_SENTINEL_"


def pose_process(in_queue: Queue, out_queue: Queue, model_settings: settings.ModelSettings) -> None:
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
            print(e)
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


class PoseProcessor(VideoProcessorBase):
    # NOTE: 変数多すぎ。減らすorまとめたい
    def __init__(
        # NOTE: ここはinitの瞬間に必要ないものは消していいらしい
        self,
        model_settings: settings.ModelSettings,
        is_saving: bool,
        # save_settings: SaveSettings,
        display_settings: settings.DisplaySettings,
        rep_count_settings: settings.RepCountSettings,
        uploaded_pose_file=None,
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

        # NOTE: 変数をまとめたいよう（realtime_settings, realtime_states, uploaded_settings, training_menu_settings）
        self.model_settings = model_settings
        # TODO: self.save_settings = save_settings
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

        self._init_coach_poses(uploaded_pose_file=uploaded_pose_file)

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

    def _show_loaded_pose(self, frame):
        self.showing_coach_pose = self.loaded_frames.pop(0)
        frame = draw_landmarks_pose(frame, self.showing_coach_pose, pose_color=(0, 255, 0))
        return frame

    # TODO: adjust webcam input aspect when rotate
    def _reset_training_set(self, realtime_pose: PoseLandmarksObject):
        if self.uploaded_frames:
            self.positioned_frames = self._adjust_poses(realtime_pose, self.uploaded_frames)
            self.loaded_frames = self.positioned_frames.copy()

        self.rep_state.reset_rep(pose=realtime_pose)
        print(self.rep_state.initial_body_height)

    def _init_coach_poses(self, uploaded_pose_file):
        # お手本ポーズを3DでLoad
        self.uploaded_pose_file = uploaded_pose_file
        self.loaded_frames: List[PoseLandmarksObject] = []
        self.uploaded_frames: List[PoseLandmarksObject] = []
        self.positioned_frames: List[PoseLandmarksObject] = []
        if uploaded_pose_file is not None:
            self.uploaded_frames = pickle.load(uploaded_pose_file)
            self.loaded_frames = self.uploaded_frames.copy()

    def _adjust_poses(
        self, realtime_pose: PoseLandmarksObject, loaded_frames: List[PoseLandmarksObject], start_frame_idx: int = 0
    ) -> List[PoseLandmarksObject]:
        realtime_height = realtime_pose.get_2d_height()
        loaded_height = loaded_frames[start_frame_idx].get_2d_height()
        scale = realtime_height / loaded_height  # スケーリング用の定数

        realtime_foot_position = realtime_pose.get_foot_position()
        loaded_foot_position = loaded_frames[start_frame_idx].get_foot_position() * scale

        # 位置合わせ用の[x,y,0]のベクター
        slide: np.ndarray = realtime_foot_position - loaded_foot_position
        slide[2] = 0
        print(scale, slide)

        adjusted_poses = [
            PoseLandmarksObject(
                landmark=frame.landmark * scale + slide, visibility=frame.visibility, timestamp=frame.timestamp
            )
            for frame in loaded_frames
        ]

        return adjusted_poses

    def _update_realtime_coaching(self, pose: PoseLandmarksObject) -> None:
        recommend = ["squat"]
        if np.linalg.norm(pose.landmark[27] - pose.landmark[28]) < np.linalg.norm(
            self.showing_coach_pose.landmark[27] - self.showing_coach_pose.landmark[28]
        ):
            recommend.append("もう少し足幅を広げましょう")
        if np.linalg.norm(pose.landmark[15] - pose.landmark[16]) < np.linalg.norm(
            self.showing_coach_pose.landmark[15] - self.showing_coach_pose.landmark[16]
        ):
            recommend.append("手幅を広げましょう")
        self.coaching_contents = recommend

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def _create_video_writer(self, fps: int, frame: av.VideoFrame) -> cv2.VideoWriter:
        """Save video as mp4."""
        assert self.video_save_path is not None
        assert isinstance(frame, av.VideoFrame)
        os.makedirs(os.path.dirname(self.video_save_path), exist_ok=True)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        video = cv2.VideoWriter(self.video_save_path, fourcc, fps, (frame.width, frame.height))
        print(f"Start saving video to {self.video_save_path} ...")
        return video

    def _release_video_writer(self) -> None:
        print("Releasing video_writer...")
        self.video_writer.release()
        self.video_writer = None
        print(f"Video has saved to {self.video_save_path}")

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        recv_timestamp: float = time.time()
        display_fps = self._FpsCalculator.get()

        frame = frame.to_ndarray(format="bgr24")
        frame = cv2.flip(frame, 1)  # ミラー表示
        # TODO: ここで image に対して single camera calibration
        if self.display_settings.rotate_webcam_input:
            frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(frame)

        # 動画の保存
        if self.is_saving:
            # 初期化
            if self.video_writer is None:
                assert self.video_save_path is not None
                frame_to_save = av.VideoFrame.from_ndarray(frame, format="rgb24")
                self.video_writer = self._create_video_writer(fps=30, frame=frame_to_save)
                print(f"initialized video writer to save {self.video_save_path}")
            # 動画の保存（フレームの追加）
            self.video_writer.write(frame)

        # 動画の保存（writerの解放）
        if (not self.is_saving) and (self.video_writer is not None):
            self._release_video_writer()

        # 検出実施 #############################################################
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result_pose: PoseLandmarksObject = self._infer_pose(frame)

        if self.display_settings.show_2d and result_pose:

            # セットの最初にリセットする
            # TODO: 今はボタンがトリガーだが、ゆくゆくは声などになる
            if self.is_clicked_reset_button:
                self._reset_training_set(realtime_pose=result_pose)
                self.is_clicked_reset_button = False

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
                if self.positioned_frames:
                    self.loaded_frames = self.positioned_frames.copy()
                color = (0, 0, 255)
            else:
                color = (255, 0, 0)

            # Poseの描画 ################################################################
            if result_pose.landmark is not None:
                processed_frame = draw_landmarks_pose(processed_frame, result_pose, pose_color=color)

            # お手本Poseの描画
            if self.loaded_frames:
                processed_frame = self._show_loaded_pose(processed_frame)
                self._update_realtime_coaching(result_pose)

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

        # Show fps
        if self.display_settings.show_fps:
            cv2.putText(
                processed_frame,
                "FPS:" + str(display_fps),
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

        # Show rep count
        if self.rep_count_settings.do_count_rep:
            cv2.putText(
                processed_frame,
                f"Rep:{self.rep_state.rep_count}",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                1,
                cv2.LINE_AA,
            )

        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
