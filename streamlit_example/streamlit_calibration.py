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
from streamlit_webrtc import ClientSettings, VideoProcessorBase, WebRtcMode, webrtc_streamer

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


def main():
    calibration_parameters = {}
    # criteria used by checkerboard pattern detector.
    # Change this if the code can't find the checkerboard
    calibration_parameters["criteria"] = (cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 30, 0.001)

    calibration_parameters["rows"] = 6  # number of checkerboard rows.
    calibration_parameters["columns"] = 9  # number of checkerboard columns.
    calibration_parameters["world_scaling"] = 1  # change this to the real world square size. Or not.

    save_frame = st.button("Save frame!")
    finish_capture = st.button("Finish capture!")

    def processor_factory():
        return CalbrationProcessor(
            save_frame=save_frame, finish_capture=finish_capture, calibration_parameters=calibration_parameters
        )

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=processor_factory,
        )

    webrtc_ctx_main = gen_webrtc_ctx(key="posefit_main_cam")
    st.session_state["started"] = webrtc_ctx_main.state.playing

    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.save_frame = save_frame
        webrtc_ctx_main.video_processor.finish_capture = finish_capture

    webrtc_ctx_sub = gen_webrtc_ctx(key="posefit_sub_cam")

    if webrtc_ctx_sub.video_processor:
        cam_type: str = "sub"
        webrtc_ctx_sub.video_processor.save_frame = save_frame
        webrtc_ctx_sub.video_processor.finish_capture = finish_capture


if __name__ == "__main__":
    main()
