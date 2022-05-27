import datetime
import json
import os
from pathlib import Path
from typing import List, Union

import cv2 as cv2
import streamlit as st
from processor import CalibrationProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from utils import CalibConfig, CameraState, single_calibrate, stereo_calibrate
from utils.class_objects import DisplaySettings, ModelSettings


def app():
    if "camera_info_meta" in st.session_state:
        camera_info_meta = st.session_state["camera_info_meta"]
        camera_info_path = camera_info_meta["camera_info_path"]
    else:
        camera_info_meta = dict()
        camera_info_path = ""

    with st.sidebar:
        front_device_name = st.selectbox("front camera name", ("A", "B"))
        side_device_name = st.selectbox("side camera name", ("A", "B"))
        with st.expander("Board Settings"):
            board_rows = int(st.number_input("Row number", value=5))
            board_columns = int(st.number_input("Column number", value=7))
            square_size = st.number_input("Square size", value=7.0)
        make_dir = st.button("make dir")
        save_frame = st.button("Save frame", disabled=(camera_info_meta == {}))
        calculate_cam_mtx = st.button("Start Calibrate", disabled=(camera_info_meta == {}))

    if make_dir:
        calibration_date = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M")
        camera_info_path = f"data/camera_info/{calibration_date}"
        camera_info_meta = dict()
        camera_info_meta["camera_info_path"] = camera_info_path
        camera_info_meta["camera_name"] = {"front": front_device_name, "side": side_device_name}
        camera_info_meta["created_at"] = calibration_date
        camera_info_meta["used_in"] = []
        st.session_state["camera_info_meta"] = camera_info_meta

        os.makedirs(camera_info_path, exist_ok=True)
        with open(f"{camera_info_path}/camera_meta.json", "w") as f:
            json.dump(camera_info_meta, f)
        make_dir = False

    if calculate_cam_mtx:
        st.write("Caluculating Camera Matrix...")
        calib_config = CalibConfig(board_shape=(board_rows, board_columns), square_size=square_size)  # type: ignore
        front_camera_state = CameraState(name="front")
        side_camera_state = CameraState(name="side")
        front_rmse: float = single_calibrate(
            calib_config=calib_config, camera_state=front_camera_state, base_dir=camera_info_path
        )
        side_rmse: float = single_calibrate(
            calib_config=calib_config, camera_state=side_camera_state, base_dir=camera_info_path
        )
        stereo_rmse: float = stereo_calibrate(
            calib_config=calib_config,
            front_camera_state=front_camera_state,
            side_camera_state=side_camera_state,
            base_dir=camera_info_path,
        )
        calculate_cam_mtx = False
        camera_info_meta["rmse"] = {"front_rmse": front_rmse, "side_rmse": side_rmse, "stereo_rmse": stereo_rmse}
        st.session_state["camera_info_meta"] = camera_info_meta

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

    main_col, sub_col = st.columns(2)
    with main_col:
        webrtc_ctx_main = gen_webrtc_ctx(key="main_cam")
        st.session_state["started"] = webrtc_ctx_main.state.playing

        if webrtc_ctx_main.video_processor:
            webrtc_ctx_main.video_processor.save_frame = save_frame
            webrtc_ctx_main.video_processor.imgs_dir = f"{camera_info_path}/front/imgs"

    with sub_col:
        webrtc_ctx_sub = gen_webrtc_ctx(key="sub_cam")

        if webrtc_ctx_sub.video_processor:
            webrtc_ctx_sub.video_processor.save_frame = save_frame
            webrtc_ctx_sub.video_processor.imgs_dir = f"{camera_info_path}/side/imgs"

    if save_frame and webrtc_ctx_main.video_processor and webrtc_ctx_sub.video_processor:
        st.write(str(webrtc_ctx_main.video_processor.capture_index + 1) + " Frames captured")
        os.makedirs(f"{webrtc_ctx_main.video_processor.imgs_dir}", exist_ok=True)
        os.makedirs(f"{webrtc_ctx_sub.video_processor.imgs_dir}", exist_ok=True)
        cv2.imwrite(
            f"{webrtc_ctx_main.video_processor.imgs_dir}/img{webrtc_ctx_main.video_processor.capture_index}.png",
            webrtc_ctx_main.video_processor.frame,
        )
        cv2.imwrite(
            f"{webrtc_ctx_sub.video_processor.imgs_dir}/img{webrtc_ctx_main.video_processor.capture_index}.png",
            webrtc_ctx_sub.video_processor.frame,
        )
        webrtc_ctx_main.video_processor.capture_index += 1
        webrtc_ctx_main.video_processor.save_frame = False

    with st.sidebar:
        st.markdown("---")
        camera_info_meta_json = st.file_uploader("camera_meta", "json")
        if camera_info_meta_json and camera_info_meta == {}:
            camera_info_meta = json.load(camera_info_meta_json)
            st.session_state["camera_info_meta"] = camera_info_meta
            camera_info_path = camera_info_meta["camera_info_path"]

    if not camera_info_meta == {}:
        st.write(camera_info_meta)


if __name__ == "__main__":
    app()
