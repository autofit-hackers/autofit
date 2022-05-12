from ast import Not
from curses import meta
from pathlib import Path
from typing import Dict, Any

import streamlit as st
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from processor.proto_processor import PrototypeProcessor
from ui_components.session import load_session_meta_data
from ui_components.setting_ui import (
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
        should_draw_graph: bool = st.checkbox("Draw Graph", value=True)

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

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            # desired_playing_state=False,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=lambda: PrototypeProcessor(**settings_to_refresh),
        )

    def _gen_and_refresh_webrtc_ctx(key: str):
        webrtc_ctx = gen_webrtc_ctx(key=key)
        if base_save_dir is not None:
            settings_to_refresh.update(_gen_save_paths(base_save_dir=base_save_dir, key=key))
        if webrtc_ctx.video_processor:
            _update_video_processor(webrtc_ctx.video_processor, settings_to_refresh)
        return webrtc_ctx

    _gen_and_refresh_webrtc_ctx(key="front")


def _update_video_processor(vp, to_refresh: Dict[str, Any]) -> None:
    for key, val in to_refresh.items():
        # assert hasattr(vp, key), f"{key}"
        vp.__dict__[key] = val
    return


def _gen_save_paths(base_save_dir: Path, key: str) -> Dict[str, str]:
    st.write(str(base_save_dir))
    return {
        "pose_save_path": str(base_save_dir / "pose" / f"{key}.pkl"),
        "video_save_path": str(base_save_dir / "video" / f"{key}.mp4"),
    }


if __name__ == "__main__":
    app()
