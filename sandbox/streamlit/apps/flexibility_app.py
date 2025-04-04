from pathlib import Path
from typing import Dict, Any

import streamlit as st
from processor import FlexibilityProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from lib.streamlit_ui.session import load_session_meta_data
from lib.streamlit_ui.setting_ui import (
    display_setting_ui,
    model_setting_ui,
    rep_count_setting_ui,
    save_state_ui,
)
import plotly.express as px
import time
import pandas as pd


def app():
    settings_to_refresh: Dict[str, Any] = {}

    with st.sidebar:
        session_meta_exists = load_session_meta_data()
        if session_meta_exists:
            base_save_dir = Path(st.session_state["session_meta"]["session_path"])
        else:
            base_save_dir = None

        st.markdown("""---""")
        use_two_cam: bool = st.checkbox("Use two cam", value=False)
        should_draw_graph: bool = st.checkbox("Draw Graph", value=False)

        st.markdown("---")
        st.markdown("## Coach Pose")

        settings_to_refresh.update(
            {
                "uploaded_pose_file": st.file_uploader("Load example pose file (.pkl)", type="pkl"),
                "is_clicked_reset_button": st.button("Reset Pose and Start Training Set"),
                "is_saving": save_state_ui(),
                "model_settings": model_setting_ui(),
                "rep_count_settings": rep_count_setting_ui(),
                "display_settings": display_setting_ui(),
            }
        )

    settings_to_refresh.update(
        {
            "is_clicked_capture_skeleton": st.button("Save Screen Capture", disabled=(not session_meta_exists)),
        }
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
            video_processor_factory=lambda: FlexibilityProcessor(**settings_to_refresh),
        )

    def _gen_and_refresh_webrtc_ctx(key: str):
        webrtc_ctx = gen_webrtc_ctx(key=key)
        if base_save_dir is not None:
            settings_to_refresh.update(_gen_save_paths(base_save_dir=base_save_dir, key=key))
        if webrtc_ctx.video_processor:
            _update_video_processor(webrtc_ctx.video_processor, settings_to_refresh)
        return webrtc_ctx

    if use_two_cam:
        main_col, sub_col = st.columns(2)
        with main_col:
            webrtc_main = _gen_and_refresh_webrtc_ctx(key="front")
        with sub_col:
            _gen_and_refresh_webrtc_ctx(key="side")
    else:
        webrtc_main = _gen_and_refresh_webrtc_ctx(key="front")

    """https://blog.streamlit.io/how-to-build-a-real-time-live-dashboard-with-streamlit/"""
    placeholder = st.empty()
    while webrtc_main.video_processor and should_draw_graph:
        df = webrtc_main.video_processor.rep_state.body_heights_df
        if len(df) == 0:
            print("ERROR(by Endo): can't draw graph; body heights don't exist")
            break
        with placeholder.container():
            st.write(webrtc_main.video_processor.coaching_contents)
            st.markdown("### Chart")
            fig = px.line(
                data_frame=df,
                y=["height", "velocity"],
                range_x=[len(df) - 600, len(df)],
            )
            st.write(fig)
            st.write(df)
            time.sleep(0.1)


def _update_video_processor(vp, to_refresh: Dict[str, Any]) -> None:
    for key, val in to_refresh.items():
        assert hasattr(vp, key), f"{key}"
        vp.__dict__[key] = val
    return


def _gen_save_paths(base_save_dir: Path, key: str) -> Dict[str, str]:
    st.write(str(base_save_dir))
    return {
        "pose_save_path": str(base_save_dir / "pose" / f"{key}.pkl"),
        "video_save_path": str(base_save_dir / "demo_video" / f"flexibility.mp4"),
        "image_save_path": str(base_save_dir / "demo_image" / f"flexibility.jpg"),
    }


if __name__ == "__main__":
    app()
