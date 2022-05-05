import datetime
import json
import os
from dataclasses import asdict
from pathlib import Path
from typing import List, Union

import cv2 as cv
import streamlit as st
from processor import CalibrationProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from ui_components import camera_info_ui
from utils import (
    CalibrationSettings,
    CameraInfo,
    CameraStates,
    DisplaySettings,
    ModelSettings,
    gen_in_recorder_factory,
    single_calibrate,
    stereo_calibrate,
)


def app():
    # Initialize st.session_state
    if "is_video_started" not in st.session_state:
        st.session_state["is_video_started"] = False
    if "camera_info" not in st.session_state:
        st.session_state["camera_info"] = None

    # User inputs
    with st.sidebar:
        front_device_name = st.selectbox("front camera name", ("A", "B"))
        side_device_name = st.selectbox("side camera name", ("A", "B"))
        with st.expander("Board Settings"):
            board_rows = int(st.number_input("Row number", value=5))
            board_columns = int(st.number_input("Column number", value=7))
            square_size = st.number_input("Square size", value=7.0)
        make_dir = st.button("Make New Camera Info")
        save_frame = st.button("Save frame", disabled=not st.session_state["is_video_started"])
        calculate_cam_mtx = st.button("Start Calibrate", disabled=not st.session_state["is_video_started"])

    # Make camera dir and info.json
    if make_dir:
        created_at = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M")
        camera_dir_path = f"data/camera_info/{created_at}"
        camera_info = CameraInfo(
            camera_dir_path=str(camera_dir_path),
            camera_names={"front": front_device_name, "side": side_device_name},
            created_at=created_at,
            used_in=[],
        )
        os.makedirs(camera_dir_path, exist_ok=True)
        with open(f"{camera_dir_path}/camera_info.json", "w") as f:
            json.dump(asdict(camera_info), f)
        st.write("New Camera Info has been created!")
        st.session_state["camera_info"] = camera_info

    # Matrix calculation
    if calculate_cam_mtx and st.session_state["camera_info"]:
        camera_info: CameraInfo = st.session_state["camera_info"]
        st.write("Caluculating Camera Matrix...")
        calibration_settings = CalibrationSettings(board_shape=(board_rows, board_columns), square_size=square_size)
        front_camera_states = CameraStates(position="front", name=front_device_name)
        side_camera_states = CameraStates(position="side", name=side_device_name)
        front_rmse: float = single_calibrate(
            calib_config=calibration_settings,
            camera_state=front_camera_states,
            base_dir=Path(camera_info.camera_dir_path),
        )
        side_rmse: float = single_calibrate(
            calib_config=calibration_settings,
            camera_state=side_camera_states,
            base_dir=Path(camera_info.camera_dir_path),
        )
        stereo_rmse: float = stereo_calibrate(
            calib_config=calibration_settings,
            front_camera_state=front_camera_states,
            side_camera_state=side_camera_states,
            base_dir=Path(camera_info.camera_dir_path),
        )
        camera_info.calibration_rmse = {"front": front_rmse, "side": side_rmse, "stereo": stereo_rmse}
        with open(f"{camera_info.camera_dir_path}/camera_info.json", "w") as f:
            json.dump(asdict(camera_info), f)
        st.write(camera_info.calibration_rmse)

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

    # XXX: Causing a lot of message from streamlit_webrtc
    if st.session_state["camera_info"]:
        camera_info: CameraInfo = st.session_state["camera_info"]
        main_col, sub_col = st.columns(2)
        with main_col:
            webrtc_ctx_main = gen_webrtc_ctx(key="main_cam")
            st.session_state["is_video_started"] = webrtc_ctx_main.state.playing

            if webrtc_ctx_main.video_processor:
                webrtc_ctx_main.video_processor.save_frame = save_frame
                webrtc_ctx_main.video_processor.imgs_dir = f"{camera_info.camera_dir_path}/front/imgs"

        with sub_col:
            webrtc_ctx_sub = gen_webrtc_ctx(key="sub_cam")

            if webrtc_ctx_sub.video_processor:
                webrtc_ctx_sub.video_processor.save_frame = save_frame
                webrtc_ctx_sub.video_processor.imgs_dir = f"{camera_info.camera_dir_path}/side/imgs"

        # Save frames
        if save_frame and webrtc_ctx_main.video_processor and webrtc_ctx_sub.video_processor:
            st.write(str(webrtc_ctx_main.video_processor.capture_index + 1) + " Frames captured")
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


if __name__ == "__main__":
    app()
