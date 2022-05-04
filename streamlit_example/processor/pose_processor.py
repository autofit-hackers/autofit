import copy
import json
import os
import pickle
import time
from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
from apps.pose3d_reconstruction import reconstruct_pose_3d
from streamlit_webrtc import VideoProcessorBase
from utils import FpsCalculator, PoseLandmarksObject, draw_landmarks_pose, mp_res_to_pose_obj
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, SaveStates

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
        model_settings: ModelSettings,
        save_state: SaveStates,
        # save_settings: SaveSettings,
        display_settings: DisplaySettings,
        rep_count_settings: RepCountSettings,
        reload_pose: bool,
        uploaded_pose_file=None,
        reset_button: bool = False,
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
        self.save_state = save_state
        self.display_settings = display_settings
        self.rep_count_settings = rep_count_settings

        self.rep_count = 0
        self.frame_index = 0
        self.is_lifting_up = False
        self.body_length = 0
        self.initial_body_height = 0
        self.reload_pose = reload_pose
        self.reset_button = reset_button

        self.video_save_path = video_save_path
        self.video_writer: Union[cv.VideoWriter, None] = None

        self.pose_save_path: Union[str, None] = pose_save_path
        self.pose_memory: List[PoseLandmarksObject] = []

        self.key_frame_draw_count = 0

        # お手本ポーズを3DでLoad
        self.uploaded_pose_file = uploaded_pose_file
        self.loaded_frames: List[PoseLandmarksObject] = []
        self.uploaded_frames: List[PoseLandmarksObject] = []
        if uploaded_pose_file is not None:
            self.uploaded_frames = self._load_pose(uploaded_pose_file)
            self.loaded_frames = self.uploaded_frames.copy()  # 消す

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

    def _load_pose(self, uploaded_pose_file):
        with open(f"recorded_poses/{uploaded_pose_file.name}", "rb") as handle:
            loaded_frames = pickle.load(handle)
        return loaded_frames

    def _show_loaded_pose(self, frame):
        self.showing_coach_pose = self.loaded_frames.pop(0)
        frame = draw_landmarks_pose(
            frame,
            self.showing_coach_pose,
            is_loaded=True,
        )
        return frame

    # TODO: adjust webcam input aspect when rotate
    def _reset_training_set(self, realtime_pose: PoseLandmarksObject):
        if self.uploaded_frames:
            self.positioned_frames = self._adjust_poses(realtime_pose, self.uploaded_frames)
            print(len(self.positioned_frames))
            self.loaded_frames = self.positioned_frames.copy()
        self.initial_body_height = realtime_pose.get_height()
        print(self.initial_body_height)
        self.frame_index = 0
        self.rep_count = 0
        self.is_lifting_up = False

    def _adjust_poses(
        self, realtime_pose: PoseLandmarksObject, loaded_frames: List[PoseLandmarksObject], start_frame_idx: int = 0
    ) -> List[PoseLandmarksObject]:
        """拡大縮小・平行移動により、ロードしたお手本フォームを現在のトレーニーのフォームに重ね合わせる

        Args:
            realtime_pose (PoseLandmarksObject): トレーニーのリアルタイムのポーズ1フレーム
            loaded_frames (List[PoseLandmarksObject]): ロードしたお手本フォーム
            start_frame_idx (int, optional): お手本フォームのキーフレーム. Defaults to 0.

        Returns:
            List[PoseLandmarksObject]: 重ね合わせ後のお手本フォーム
        """
        realtime_height = realtime_pose.get_height()
        loaded_height = loaded_frames[start_frame_idx].get_height()
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

    def _update_rep_count(self, pose: PoseLandmarksObject, upper_thre: float, lower_thre: float) -> None:
        if self.frame_index == 0:
            self.initial_body_height = pose.get_height()
        else:
            self.body_length = pose.landmark[29][1] - pose.landmark[11][1]
            if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_height:
                self.rep_count += 1
                self.is_lifting_up = False
            elif not self.is_lifting_up and self.body_length < lower_thre * self.initial_body_height:
                self.is_lifting_up = True

    def _is_key_frame(self, realtime_array, upper_thre=0.8, lower_thre=0.94) -> bool:
        is_key_frame: bool = False
        if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_height:
            # self.(realtime_array)
            is_key_frame = True
        # print(
        #     self.is_lifting_up,
        #     (self.body_length > upper_thre * self.initial_body_height),
        #     self.body_length,
        #     self.initial_body_height,
        #     is_key_frame,
        # )
        return is_key_frame

    def _realtime_coaching(self, pose: PoseLandmarksObject):
        recommend = []
        if np.linalg.norm(pose.landmark[27] - pose.landmark[28]) < np.linalg.norm(
            self.showing_coach_pose.landmark[27] - self.showing_coach_pose.landmark[28]
        ):
            recommend.append("もう少し足幅を広げましょう")
        if np.linalg.norm(pose.landmark[15] - pose.landmark[16]) < np.linalg.norm(
            self.showing_coach_pose.landmark[15] - self.showing_coach_pose.landmark[16]
        ):
            recommend.append("手幅を広げましょう")
        return recommend

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def _create_video_writer(self, fps: int, frame: av.VideoFrame) -> cv.VideoWriter:
        """Save video as mp4."""
        assert self.video_save_path is not None
        assert isinstance(frame, av.VideoFrame)
        os.makedirs(os.path.dirname(self.video_save_path), exist_ok=True)
        video = cv.VideoWriter(self.video_save_path, fps=fps, frame_size=(frame.width, frame.height))
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

        if self.save_state.is_saving_video and (self.video_writer is None):
            # video_writer の初期化
            # TODO: fps は 30 で決め打ちしているが、実際には処理環境に応じて変化する
            assert self.video_save_path is not None
            self.video_writer = self._create_video_writer(fps=30, frame=frame)
            print(f"initialized video writer to save {self.video_save_path}")

        frame = frame.to_ndarray(format="bgr24")
        frame = cv.flip(frame, 1)  # ミラー表示
        # TODO: ここで image に対して single camera calibration
        if self.display_settings.rotate_webcam_input:
            frame = cv.rotate(frame, cv.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(frame)

        # 動画の保存（初期化
        # if (self.save_state.is_saving_video) and (self.video_writer is None) and (self.video_save_path is not None):
        if self.save_state.is_saving_video:
            # 動画の保存（フレームの追加）
            # NOTE: video_writer は cv2 の実装を用いているため、BGRの色順で良い
            self.video_writer.write(frame)

        # 動画の保存（writerの解放）
        if (not self.save_state.is_saving_video) and (self.video_writer is not None):
            self._release_video_writer()

        # 検出実施 #############################################################
        frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        results: PoseLandmarksObject = self._infer_pose(frame)

        if self.display_settings.show_2d and results:

            # results -> ndarray (named: realtime_array) : 不要
            self.realtime_array = results

            # キーフレームを検出してフレームをリロード
            if self._is_key_frame(self.realtime_array):
                self.key_frame_draw_count = 30
                # self.loaded_frames = self.positioned_frames.copy()
            if self.key_frame_draw_count > 0:
                cv.putText(
                    processed_frame,
                    "KEY FRAME",
                    (10, 90),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    (0, 255, 128),
                    2,
                    cv.LINE_AA,
                )
                self.key_frame_draw_count -= 1

            # セットの最初にリセットする
            # TODO: 今はボタンがトリガーだが、ゆくゆくは声などになる
            if self.reset_button:
                self._reset_training_set(results)
                self.reset_button = False

            if self.rep_count_settings.do_count_rep:
                # レップカウントを更新
                assert self.rep_count_settings.upper_thresh is not None
                assert self.rep_count_settings.lower_thresh is not None
                self._update_rep_count(
                    results,
                    upper_thre=self.rep_count_settings.upper_thresh,
                    lower_thre=self.rep_count_settings.lower_thresh,
                )

            # NOTE: ここに指導がくるので、ndarrayで持ちたい
            # NOTE: または infer_pose -> results to ndarray -> 重ね合わせパラメータ取得・指導の計算 -> ndarray to results -> 描画
            # TODO: realtime coaching の動作確認とデバッグ
            # print(self._realtime_coaching(results))

            # Poseの描画 ################################################################
            if results.landmark is not None:
                # 描画
                processed_frame = draw_landmarks_pose(
                    processed_frame,
                    results,
                )

            # お手本Poseの描画
            if self.loaded_frames:
                # お手本poseは先に変換しておいてここでは呼ぶだけとする
                processed_frame = self._show_loaded_pose(processed_frame)

        # pose の保存 (pose_mem への追加) ########################################################
        if self.save_state.is_saving_pose and self.pose_save_path is not None:
            self.pose_memory.append(
                results
                if results
                else PoseLandmarksObject(
                    landmark=np.zeros(shape=(33, 3)), visibility=np.zeros(shape=(33, 1)), timestamp=recv_timestamp
                )
            )  # NOTE: ビデオのフレームインデックスとposeのフレームインデックスを一致させるために、2D Pose Estimation ができなかった場合は zero padding

        # pose の保存（書き出し）
        if (len(self.pose_memory) > 0) and (not self.save_state.is_saving_pose):
            self._save_pose()
            # self._reconstruct_pose_3d
            self.pose_memory = []

        # Show fps
        if self.display_settings.show_fps:
            cv.putText(
                processed_frame,
                "FPS:" + str(display_fps),
                (10, 30),
                cv.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
                cv.LINE_AA,
            )

        # Show rep count
        if self.rep_count_settings.do_count_rep:
            cv.putText(
                processed_frame,
                f"Rep:{self.rep_count}",
                (10, 60),
                cv.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                1,
                cv.LINE_AA,
            )

        self.frame_index += 1
        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
