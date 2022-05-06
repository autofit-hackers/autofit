import copy
import json
import os
import pickle
from multiprocessing import Process, Queue
from typing import List, Union

import av
import cv2 as cv
import numpy as np
from streamlit_webrtc import VideoProcessorBase

from utils import FpsCalculator, draw_landmarks_pose, PoseLandmarksObject, mp_res_to_pose_obj
from utils.class_objects import ModelSettings, DisplaySettings, PoseDef
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
        skeleton_save_path: Union[str, None] = None,
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

        # NOTE: 変数をまとめたいよう（realtime_settings, realtime_states, uploaded_settimgs, training_menu_settings）
        self.model_settings = model_settings
        self.display_settings = display_settings

        self.is_clicked_capture_skeleton = is_clicked_capture_skeleton
        self.skeleton_save_path: Union[str, None] = skeleton_save_path
        self.image_save_path: Union[str, None] = image_save_path

        self._pose_process.start()

    # NOTE: infer or estimate で用語統一する?
    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_estimated_pose(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _save_bone_info(self, captured_skeleton: PoseLandmarksObject):
        bone_dict = captured_skeleton.get_bone_lengths()
        assert self.skeleton_save_path
        with open(self.skeleton_save_path, "w") as fp:
            # TODO: data.json のパスをインスタンス変数化
            json.dump(bone_dict, fp)

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._FpsCalculator.get()

        # カメラキャプチャ #####################################################
        frame = frame.to_ndarray(format="bgr24")

        frame = cv.flip(frame, 1)  # ミラー表示
        # TODO: ここで image に対して single camera calibration
        if self.display_settings.rotate_webcam_input:
            frame = cv.rotate(frame, cv.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(frame)

        # 画像の保存
        # TODO: capture skeleton の rename or jsonの保存までするように関数書き換え
        if self.is_clicked_capture_skeleton and self.image_save_path:
            os.makedirs(os.path.dirname(self.image_save_path), exist_ok=True)
            cv.imwrite(self.image_save_path, frame)

        # 検出実施 #############################################################
        frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        result_pose: PoseLandmarksObject = self._infer_pose(frame)

        if result_pose:
            self.result_pose = result_pose

            # Poseの描画 ################################################################
            if result_pose.landmark is not None:
                # 描画
                processed_frame = draw_landmarks_pose(image=processed_frame, landmarks=result_pose)

                if self.is_clicked_capture_skeleton and self.image_save_path:
                    self._save_bone_info(result_pose)
                    self.is_clicked_capture_skeleton = False

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

        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
        print("Stopped!")
