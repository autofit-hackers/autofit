import copy
import os
import pickle
import time
from typing import List
import av
from numpy import ndarray
import streamlit as st
import mediapipe as mp
import cv2
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from multiprocessing import Process, Queue
from utils.class_objects import ModelSettings, PoseLandmarksObject, mp_res_to_pose_obj

_SENTINEL_ = "_SENTINEL_"


def build_webcam_streams(processor, key: str):
    return webrtc_streamer(
        key=key,
        mode=WebRtcMode.SENDRECV,
        client_settings=ClientSettings(
            rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
            media_stream_constraints={"video": True, "audio": False},
        ),
        video_processor_factory=processor,
    )


class PoseEstimationProcess(Process):
    def __init__(self, model_settings: ModelSettings):
        super(PoseEstimationProcess, self).__init__()
        mp_pose = mp.solutions.pose  # type: ignore
        self.pose = mp_pose.Pose(
            model_complexity=model_settings.model_complexity,
            min_detection_confidence=model_settings.min_detection_confidence,
            min_tracking_confidence=model_settings.min_tracking_confidence,
        )
        self._in_queue = Queue()
        self._out_queue = Queue()

    def run(self):
        """
        automatically executed when the process starts
        """
        self._run_estimator()

    def _run_estimator(self):
        while True:
            try:
                input_frame = self._in_queue.get(timeout=10)
                timestamp: float = time.time()
            except Exception as e:
                print(e)
                continue

            if isinstance(input_frame, type(_SENTINEL_)) and input_frame == _SENTINEL_:
                break

            estimation_result = self.pose.process(input_frame)
            if estimation_result.pose_landmarks is None:
                self._out_queue.put_nowait(None)
                continue

            self._out_queue.put_nowait(mp_res_to_pose_obj(estimation_result, timestamp=timestamp))

    def get_pose(self, frame) -> PoseLandmarksObject:
        self._in_queue.put_nowait(frame)
        pose = self._out_queue.get(timeout=10)
        return pose


def pose_process(in_queue: Queue, out_queue: Queue, model_settings: ModelSettings) -> None:
    mp_pose = mp.solutions.pose  # type: ignore
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
        if results.pose_landmarks is None:
            out_queue.put_nowait(None)
            continue

        out_queue.put_nowait(mp_res_to_pose_obj(results, timestamp=outqueue_timestamp))


def stop_pose_process(in_queue: Queue, pose_process: Process):
    in_queue.put_nowait(_SENTINEL_)
    pose_process.join(timeout=10)


def infer_pose(image, in_queue: Queue, out_queue: Queue) -> PoseLandmarksObject:
    in_queue.put_nowait(image)
    return out_queue.get(timeout=10)


def save_pose(pose_save_path, pose_memory: List[PoseLandmarksObject]):
    print(f"Saving {len(pose_memory)} pose frames to {pose_save_path}")
    os.makedirs(os.path.dirname(pose_save_path), exist_ok=True)
    with open(pose_save_path, "wb") as f:
        pickle.dump(pose_memory, f, protocol=pickle.HIGHEST_PROTOCOL)


def process_frame_initially(frame: av.VideoFrame, should_rotate: bool) -> ndarray:
    frame_arr = frame.to_ndarray(format="bgr24")
    frame_arr = cv2.flip(frame_arr, 1)  # ミラー表示
    # TODO: ここで image に対して single camera calibration
    if should_rotate:
        frame_arr = cv2.rotate(frame_arr, cv2.ROTATE_90_CLOCKWISE)
    # frame_arr = cv2.cvtColor(frame_arr, cv2.COLOR_BGR2RGB)  # 色の修正
    return frame_arr
