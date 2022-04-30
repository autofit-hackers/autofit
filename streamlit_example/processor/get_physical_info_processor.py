import copy
import json
import os
import pickle
from multiprocessing import Process, Queue
from turtle import st
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
from streamlit_webrtc import VideoProcessorBase

from utils import FpsCalculator, draw_landmarks_pose, PoseLandmarksObject, mp_res_to_pose_obj
from utils.class_objects import ModelSettings, DisplaySettings

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

        out_queue.put_nowait(mp_res_to_pose_obj(results))


class GetPhysicalInfoProcessor(VideoProcessorBase):
    # NOTE: 変数多すぎ。減らすorまとめたい
    def __init__(
        # NOTE: ここはinitの瞬間に必要ないものは消していいらしい
        self,
        model_settings: ModelSettings,
        display_settings: DisplaySettings,
        capture_skeleton: bool,
        skeleton_save_path: Union[str, None] = None,
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

        self.capture_skeleton = capture_skeleton
        self.img_save_path: Union[str, None] = skeleton_save_path

        self._pose_process.start()

    # NOTE: infer or estimate で用語統一する?
    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_estimated_pose(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _save_bone_info(self, captured_skeleton: PoseLandmarksObject):
        print("save!!!")
        # TODO: この辺はutilsに連れて行く
        bone_edge_names = {
            "shoulder_width": (11, 12),
            "shin": (27, 25),
            "thigh": (25, 23),
            "full_leg": (27, 23),
            "pelvic_width": (23, 24),
            "flank": (23, 11),
            "upper_arm": (11, 13),
            "fore_arm": (13, 15),
            "full_arm": (11, 15),
        }

        bone_dict = {"foot_neck_height": self._calculate_height(captured_skeleton)}
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = np.linalg.norm(
                captured_skeleton.landmark[bone_edge_names[bone_edge_key][0]]
                - captured_skeleton.landmark[bone_edge_names[bone_edge_key][1]]
            )

        with open("data.json", "w") as fp:
            # TODO: data.json のパスをインスタンス変数化
            json.dump(bone_dict, fp)

    def _calculate_height(self, pose: PoseLandmarksObject):
        neck = (pose.landmark[11] + pose.landmark[12]) / 2
        foot_center = (pose.landmark[27] + pose.landmark[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def _calculate_foot_position(self, pose: PoseLandmarksObject):
        return (pose.landmark[27] + pose.landmark[28]) / 2

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
        if self.capture_skeleton and self.img_save_path:
            print(self.img_save_path)
            os.makedirs(os.path.dirname(self.img_save_path), exist_ok=True)
            cv.imwrite(self.img_save_path, frame)
            self.capture_skeleton = False

        # 検出実施 #############################################################
        frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        result_pose: PoseLandmarksObject = self._infer_pose(frame)

        if result_pose:
            self.result_pose = result_pose

            # Poseの描画 ################################################################
            if result_pose.landmark is not None:
                # 描画
                processed_frame = draw_landmarks_pose(
                    processed_frame,
                    result_pose,
                )

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
