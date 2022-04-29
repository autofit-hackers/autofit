import datetime
import os
import time
from io import StringIO
from pathlib import Path
from typing import List, Union

import streamlit as st
from processor import CalibrationProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from utils import CalibConfig, CameraState, single_calibrate, stereo_calibrate
from utils.class_objects import DisplaySettings, ModelSettings


def app():
    calib_config = CalibConfig()
    front_camera_state = CameraState(name="front")
    side_camera_state = CameraState(name="side")

    with st.sidebar:
        session_meta_file = st.file_uploader("Session Dir", type="txt")
        save_frame = st.button("Save frame")
        calculate_cam_mtx = st.button("Start Calibrate")

    if session_meta_file:
        # TODO: remove type error about this variable
        session_dir_path = StringIO(session_meta_file.getvalue().decode("utf-8")).read()

    if save_frame:
        st.write("Frames captured")

    if calculate_cam_mtx:
        st.write("Caluculating Camera Matrix...")
        single_calibrate(calib_config=calib_config, camera_state=front_camera_state, base_dir=session_dir_path)
        single_calibrate(calib_config=calib_config, camera_state=side_camera_state, base_dir=session_dir_path)
        stereo_calibrate(
            calib_config=calib_config,
            front_camera_state=front_camera_state,
            side_camera_state=side_camera_state,
            base_dir=session_dir_path,
        )
        calculate_cam_mtx = False
        st.write("Calculation Finished!")

    webrtc_ctx_main = webrtc_streamer(key="main_cam", video_processor_factory=CalibrationProcessor)

    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.save_frame = save_frame
        webrtc_ctx_main.video_processor.imgs_dir = f"{session_dir_path}/front"

    webrtc_ctx_sub = webrtc_streamer(key="sub_cam", video_processor_factory=CalibrationProcessor)

    if webrtc_ctx_sub.video_processor:
        cam_type: str = "sub"
        webrtc_ctx_sub.video_processor.save_frame = save_frame
        webrtc_ctx_sub.video_processor.imgs_dir = f"{session_dir_path}/side"


if __name__ == "__main__":
    app()
