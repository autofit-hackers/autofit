import datetime
import os
import time
from io import StringIO
from pathlib import Path
from typing import List, Union

import cv2 as cv
import streamlit as st
from processor import CalibrationProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from utils import CalibConfig, CameraState, single_calibrate, stereo_calibrate, gen_in_recorder_factory
from utils.class_objects import DisplaySettings, ModelSettings


def app():
    calib_config = CalibConfig()
    front_camera_state = CameraState(name="front")
    side_camera_state = CameraState(name="side")
    session_dir_path: str = ""

    with st.sidebar:
        session_meta_file = st.file_uploader("Session Dir", type="txt")
        save_frame = st.button("Save frame")
        calculate_cam_mtx = st.button("Start Calibrate")

    if session_meta_file:
        # TODO: remove type error about this variable
        session_dir_path = StringIO(session_meta_file.getvalue().decode("utf-8")).read()

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
    
    def processor_factory():
        return CalibrationProcessor()

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

    webrtc_ctx_main = gen_webrtc_ctx(key="main_cam")
    st.session_state["started"] = webrtc_ctx_main.state.playing

    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.save_frame = save_frame
        webrtc_ctx_main.video_processor.imgs_dir = f"{session_dir_path}/front/imgs"

    webrtc_ctx_sub = gen_webrtc_ctx(key="sub_cam")

    if webrtc_ctx_sub.video_processor:
        cam_type: str = "sub"
        webrtc_ctx_sub.video_processor.save_frame = save_frame
        webrtc_ctx_sub.video_processor.imgs_dir = f"{session_dir_path}/side/imgs"

    if save_frame:
        st.write("Frames captured")
        os.makedirs(f"{webrtc_ctx_main.video_processor.imgs_dir}", exist_ok=True)
        os.makedirs(f"{webrtc_ctx_sub.video_processor.imgs_dir}", exist_ok=True)
        cv.imwrite(
            f"{webrtc_ctx_main.video_processor.imgs_dir}/img{webrtc_ctx_main.video_processor.capture_index}.png",
            webrtc_ctx_main.video_processor.frame,
        )
        cv.imwrite(
            f"{webrtc_ctx_sub.video_processor.imgs_dir}/img{webrtc_ctx_main.video_processor.capture_index}.png",
            webrtc_ctx_sub.video_processor.frame,
        )
        webrtc_ctx_main.video_processor.capture_index += 1
        webrtc_ctx_main.video_processor.save_frame = False


if __name__ == "__main__":
    app()
