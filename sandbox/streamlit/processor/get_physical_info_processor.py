import copy
import os
import pickle
from multiprocessing import Process, Queue
from typing import Union

import av
import cv2
import numpy as np
from streamlit_webrtc import VideoProcessorBase

from utils import FpsCalculator, draw_landmarks_pose, PoseLandmarksObject, mp_res_to_pose_obj
from lib.streamlit_ui.setting_class import ModelSettings, DisplaySettings, PoseDef
from processor.pose_processor import pose_process

_SENTINEL_ = "_SENTINEL_"


class GetPhysicalInfoProcessor(VideoProcessorBase):
    # NOTE: 変数多すぎ。減らすorまとめたい
    def __init__(
        # NOTE: ここはinitの瞬間に必要ないものは消していいらしい
        self,
        model_settings: ModelSettings,
        display_settings: DisplaySettings,
        is_clicked_capture_skeleton: bool,
        image_save_path: Union[str, None] = None,
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
        self.display_settings = display_settings

        self.is_clicked_capture_skeleton = is_clicked_capture_skeleton
        self.image_save_path: Union[str, None] = image_save_path

        self._pose_process.start()

    # NOTE: infer or estimate で用語統一する?
    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_estimated_pose(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _save_image(self, frame):
        assert self.image_save_path
        os.makedirs(os.path.dirname(self.image_save_path), exist_ok=True)
        cv2.imwrite(self.image_save_path, frame)

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._FpsCalculator.get()

        # カメラキャプチャ #####################################################
        frame = frame.to_ndarray(format="bgr24")

        frame = cv2.flip(frame, 1)  # ミラー表示
        # TODO: ここで image に対して single camera calibration
        if self.display_settings.rotate_webcam_input:
            frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(frame)

        # frameの保存 ################################################################
        if self.is_clicked_capture_skeleton and self.image_save_path:
            self._save_image(frame=frame)
            self.is_clicked_capture_skeleton = False

        # 検出実施 #############################################################
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result_pose: PoseLandmarksObject = self._infer_pose(frame)

        if result_pose:
            self.result_pose = result_pose

            # Poseの描画 ################################################################
            if result_pose.landmark is not None:
                # 描画
                processed_frame = draw_landmarks_pose(image=processed_frame, landmarks=result_pose)

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

        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
        print("Stopped!")
