from curses import meta
import time
from pathlib import Path
from tkinter.tix import Tree
from typing import List, Union

import streamlit as st
from processor import PoseProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer

from utils.class_objects import DisplaySettings, ModelSettings
from utils import gen_in_recorder_factory, video_recorder


def app():
    reset_button = st.button("Reset Pose and Start Training Set")

    if "session_meta" in st.session_state:
        session_meta = st.session_state["session_meta"]
        st.json(session_meta)
    # else:
    #     session_meta_json = st.file_uploader("Select Session Info", type="json")
    #     session_meta = json.load(session_meta_json)
    #     st.write(session_meta)

    with st.sidebar:
        st.markdown("""---""")
        uploaded_pose_file = st.file_uploader("Load example pose file (.pkl)", type="pkl")
        use_two_cam: bool = st.checkbox("Use two cam", value=False)
        with st.expander("Save settings"):
            save_video = st.checkbox("Save Video", value=False)
            save_pose = st.checkbox("Save Pose", value=False)

        with st.expander("Model parameters (there parameters are effective only at initialization)"):
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
            model_settings = ModelSettings(
                model_complexity=model_complexity,
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
            )

        with st.expander("Rep counter settings"):
            count_rep: bool = st.checkbox("Count rep", value=True)
            upper_threshold = st.slider("upper_threshold", min_value=0.0, max_value=1.0, value=0.9, step=0.01)
            lower_threshold = st.slider("lower_threshold", min_value=0.0, max_value=1.0, value=0.8, step=0.01)

        # with st.expander("Save settings"):
        #     save_video = st.checkbox("Save Video", value=False)
        #     save_pose = st.checkbox("Save Pose", value=False)

        with st.expander("Display settings"):
            rotate_webcam_input = st.checkbox("Rotate webcam input", value=False)
            show_fps = st.checkbox("Show FPS", value=True)
            show_2d = st.checkbox("Show 2D", value=True)
            display_settings = DisplaySettings(
                rotate_webcam_input=rotate_webcam_input,
                show_2d=show_2d,
                show_fps=show_fps,
            )

            if st.button("RELOAD"):
                reload_pose = True
                st.write("RELOADED")
            else:
                reload_pose = False

    now_str: str = time.strftime("%Y-%m-%d-%H-%M-%S")

    def processor_factory():
        return PoseProcessor(
            model_settings=model_settings,
            display_settings=display_settings,
            uploaded_pose_file=uploaded_pose_file,
            count_rep=count_rep,
            reload_pose=reload_pose,
            upper_threshold=upper_threshold,
            lower_threshold=lower_threshold,
        )

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            # desired_playing_state=False,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=processor_factory,
            in_recorder_factory=gen_in_recorder_factory(str(Path("recorded_videos") / f"{now_str}_{key}.mp4"))
            if save_video
            else None,
        )

    webrtc_ctx_main = gen_webrtc_ctx(key="posefit_main_cam")
    st.session_state["started"] = webrtc_ctx_main.state.playing

    # NOTE: 動的に監視したい変数以外は以下に含める必要なし?
    # NOTE: mainとsubをカメラ構造体or辞書にまとめる?
    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.display_settings = display_settings
        webrtc_ctx_main.video_processor.pose_save_path = (
            str(Path("recorded_poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
        )
        webrtc_ctx_main.video_processor.skeleton_save_path = str(Path("skeletons") / f"{now_str}_{cam_type}_cam.jpg")
        webrtc_ctx_main.video_processor.uploaded_pose_file = uploaded_pose_file
        webrtc_ctx_main.video_processor.reset_button = reset_button
        webrtc_ctx_main.video_processor.count_rep = count_rep
        webrtc_ctx_main.video_processor.reload_pose = reload_pose
        webrtc_ctx_main.video_processor.upper_threshold = upper_threshold
        webrtc_ctx_main.video_processor.lower_threshold = lower_threshold
        if st.button("BODY"):
            st.write(webrtc_ctx_main.video_processor.body_length)
            print(webrtc_ctx_main.video_processor.body_length)

    if use_two_cam:
        webrtc_ctx_sub = gen_webrtc_ctx(key="posefit_sub_cam")

        if webrtc_ctx_sub.video_processor:
            cam_type: str = "sub"
            # TODO: rotate をカメラごとに設定可能にする
            webrtc_ctx_sub.video_processor.display_settings = display_settings
            webrtc_ctx_sub.video_processor.pose_save_path = (
                str(Path("recorded_poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
            )
            webrtc_ctx_sub.video_processor.skeleton_save_path = str(
                Path("skeletons") / f"{now_str}_{cam_type}_cam.jpg"
            )
            # TODO: カメラごとに異なる uploaded_pose を自動設定する
            webrtc_ctx_sub.video_processor.uploaded_pose_file = uploaded_pose_file
            webrtc_ctx_sub.video_processor.count_rep = count_rep
            webrtc_ctx_sub.video_processor.reload_pose = reload_pose
            webrtc_ctx_sub.video_processor.reset_button = reset_button
            webrtc_ctx_sub.video_processor.upper_threshold = upper_threshold
            webrtc_ctx_sub.video_processor.lower_threshold = lower_threshold


if __name__ == "__main__":
    app()
