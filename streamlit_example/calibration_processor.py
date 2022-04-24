import copy
import json
import os
import pickle
import time
from datetime import datetime
from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
import streamlit as st
from streamlit_webrtc import VideoProcessorBase

from utils.calib_cam import calibrate_camera, stereo_calibrate

_SENTINEL_ = "_SENTINEL_"


class CalbrationProcessor(VideoProcessorBase):
    def __init__(self, save_frame, finish_capture, calibration_parameters, cam_type):
        self.save_frame = save_frame
        self.finish_capture = finish_capture
        self.calibration_parameters = calibration_parameters
        self.cam_type = cam_type
        self.capture_index = 0
        return

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        frame = frame.to_ndarray(format="bgr24")
        frame = cv.flip(frame, 1)  # ミラー表示

        if self.save_frame:
            cv.imwrite(f"camera{idx}_img{self.capture_index}.png", frame)
            self.capture_index += 1
            self.save_frame = False

        return av.VideoFrame.from_ndarray(frame, format="bgr24")

    def __del__(self):
        print("Caliculate camera matrix...")
        now_str: str = time.strftime("%Y-%m-%d-%H-%M-%S")
        mtx_front, dist_front = calibrate_camera(
            image_folder=f"{self.cam_type}", calibration_parameters=self.calibration_parameters
        )
        mtx_side, dist_side = calibrate_camera(
            image_folder=f"", calibration_parameters=self.calibration_parameters
        )
        R, T = stereo_calibrate(
            mtx_front, dist_front, mtx_side, dist_side, calibration_parameters=self.calibration_parameters
        )
