import datetime
import os
import time

import av
import cv2 as cv
import streamlit as st
from streamlit_webrtc import VideoProcessorBase
from utils import CameraState

_SENTINEL_ = "_SENTINEL_"


class CalibrationProcessor(VideoProcessorBase):
    def __init__(self, save_frame, camera_state: CameraState):
        self.save_frame = save_frame
        self.capture_index = 0

        self.imgs_dir = f"{camera_state.dir}/imgs"

        return

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        frame = frame.to_ndarray(format="bgr24")
        frame = cv.flip(frame, 1)  # ミラー表示
        frame = cv.rotate(frame, cv.ROTATE_90_CLOCKWISE)

        if self.save_frame:
            os.makedirs(f"{self.imgs_dir}", exist_ok=True)
            cv.imwrite(f"{self.imgs_dir}/img{self.capture_index}.png", frame)
            self.capture_index += 1
            self.save_frame = False

        return av.VideoFrame.from_ndarray(frame, format="bgr24")

    def __del__(self):
        return
