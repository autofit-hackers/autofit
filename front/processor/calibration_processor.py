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
    def __init__(self):
        self.save_frame: bool
        self.imgs_dir: str
        self.capture_index = 0

        return

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        frame = frame.to_ndarray(format="bgr24")
        frame = cv.flip(frame, 1)  # ミラー表示
        frame = cv.rotate(frame, cv.ROTATE_90_CLOCKWISE)
        self.frame = frame

        return av.VideoFrame.from_ndarray(frame, format="bgr24")

    def __del__(self):
        return
