import datetime
import os
import time
from pathlib import Path
from typing import List, Union

import streamlit as st
from processor import CalibrationProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from utils import CalibConfig, CameraState, single_calibrate, stereo_calibrate

from utils.class_objects import ModelSettings, DisplaySettings


def app():
    now = datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
    base_dir_name = f"recorded_calib/{now}"
    calib_config = CalibConfig()
    front_camera_state = CameraState(name="front", dir=f"{base_dir_name}/front")
    side_camera_state = CameraState(name="side", dir=f"{base_dir_name}/side")

    with st.sidebar:
        save_frame = st.button("Save frame!")
        calculate_cam_mtx = st.button("Start Calibrate!")

    if save_frame:
        st.write("Frames captured")
    if calculate_cam_mtx:
        st.write("Caluculating Camera Matrix...")
        single_calibrate(calib_config=calib_config, camera_state=front_camera_state)
        single_calibrate(calib_config=calib_config, camera_state=side_camera_state)
        stereo_calibrate(
            calib_config=calib_config, front_camera_state=front_camera_state, side_camera_state=side_camera_state
        )
        calculate_cam_mtx = False
        st.write("Caluculating Camera Matrix...")

    def gen_webrtc_ctx(key: str, camera_state: CameraState):
        return webrtc_streamer(
            key=key,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=CalibrationProcessor(save_frame=save_frame, camera_state=camera_state),  # type: ignore
        )

    webrtc_ctx_main = gen_webrtc_ctx(key="main_cam", camera_state=front_camera_state)
    st.session_state["started"] = webrtc_ctx_main.state.playing

    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.save_frame = save_frame

    webrtc_ctx_sub = gen_webrtc_ctx(key="sub_cam", camera_state=side_camera_state)

    if webrtc_ctx_sub.video_processor:
        cam_type: str = "sub"
        webrtc_ctx_sub.video_processor.save_frame = save_frame


if __name__ == "__main__":
    app()
