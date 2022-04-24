import time
from pathlib import Path
from typing import List, Union

import streamlit as st
from processor import PoseProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer


def app():
    capture_skelton = False
    if st.button("Save Screen Capture"):
        capture_skelton = True
    else:
        capture_skelton = False

    with st.sidebar:
        st.markdown("""---""")
        rotate_webcam_input = st.checkbox("Rotate webcam input", value=False)
        use_two_cam: bool = st.checkbox("Use two cam", value=True)

        with st.expander("Model parameters (there parameters are effective only at initialization)"):
            static_image_mode = st.checkbox("Static image mode")
            model_complexity = st.radio("Model complexity", [0, 1, 2], index=0)
            min_detection_confidence = st.slider(
                "Min detection confidence",
                min_value=0.0,
                max_value=1.0,
                value=0.5,
                step=0.01,
            )
            min_tracking_confidence = st.slider(
                "Min tracking confidence",
                min_value=0.0,
                max_value=1.0,
                value=0.5,
                step=0.01,
            )

        with st.expander("Display settings"):
            show_fps = st.checkbox("Show FPS", value=True)
            show_2d = st.checkbox("Show 2D", value=True)

    now_str: str = time.strftime("%Y-%m-%d-%H-%M-%S")

    def processor_factory():
        return PoseProcessor(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            rev_color=rev_color,
            rotate_webcam_input=rotate_webcam_input,
            show_fps=show_fps,
            show_2d=show_2d,
            uploaded_pose=uploaded_pose,
            capture_skelton=capture_skelton,
            reset_button=reset_button,
            count_rep=count_rep,
            reload_pose=reload_pose,
            upper_threshold=upper_threshold,
            lower_threshold=lower_threshold,
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

    # NOTE: 動的に監視したい変数以外は以下に含める必要なし?
    # NOTE: mainとsubをカメラ構造体or辞書にまとめる?
    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.rev_color = rev_color
        webrtc_ctx_main.video_processor.rotate_webcam_input = rotate_webcam_input
        webrtc_ctx_main.video_processor.show_fps = show_fps
        webrtc_ctx_main.video_processor.show_2d = show_2d
        webrtc_ctx_main.video_processor.video_save_path = (
            str(Path("recorded_videos") / f"{now_str}_{cam_type}_cam.mp4") if save_video else None
        )
        webrtc_ctx_main.video_processor.pose_save_path = (
            str(Path("recorded_poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
        )
        webrtc_ctx_main.video_processor.skelton_save_path = str(Path("skeltons") / f"{now_str}_{cam_type}_cam.jpg")
        webrtc_ctx_main.video_processor.uploaded_pose = uploaded_pose
        webrtc_ctx_main.video_processor.capture_skelton = capture_skelton
        webrtc_ctx_main.video_processor.reset_button = reset_button
        webrtc_ctx_main.video_processor.count_rep = count_rep
        webrtc_ctx_main.video_processor.reload_pose = reload_pose
        webrtc_ctx_main.video_processor.upper_threshold = upper_threshold
        webrtc_ctx_main.video_processor.lower_threshold = lower_threshold

    if use_two_cam:
        webrtc_ctx_sub = gen_webrtc_ctx(key="posefit_sub_cam")

        if webrtc_ctx_sub.video_processor:
            cam_type: str = "sub"
            webrtc_ctx_sub.video_processor.rev_color = rev_color
            # TODO: rotate をカメラごとに設定可能にする
            webrtc_ctx_sub.video_processor.rotate_webcam_input = rotate_webcam_input
            webrtc_ctx_sub.video_processor.show_fps = show_fps
            webrtc_ctx_sub.video_processor.show_2d = show_2d
            webrtc_ctx_sub.video_processor.video_save_path = (
                str(Path("recorded_videos") / f"{now_str}_{cam_type}_cam.mp4") if save_video else None
            )
            webrtc_ctx_sub.video_processor.pose_save_path = (
                str(Path("recorded_poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
            )
            webrtc_ctx_sub.video_processor.skelton_save_path = str(Path("skeltons") / f"{now_str}_{cam_type}_cam.jpg")
            # TODO: カメラごとに異なる uploaded_pose を自動設定する
            webrtc_ctx_sub.video_processor.uploaded_pose = uploaded_pose
            webrtc_ctx_sub.video_processor.capture_skelton = capture_skelton
            webrtc_ctx_sub.video_processor.count_rep = count_rep
            webrtc_ctx_sub.video_processor.reload_pose = reload_pose
            webrtc_ctx_sub.video_processor.reset_button = reset_button
            webrtc_ctx_sub.video_processor.upper_threshold = upper_threshold
            webrtc_ctx_sub.video_processor.lower_threshold = lower_threshold
