from curses import meta
from pathlib import Path
from typing import Dict, Any, Union

import streamlit as st
from processor import PoseProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from ui_components.session import load_session_meta_data
from ui_components.setting_ui import (
    display_setting_ui,
    model_setting_ui,
    rep_count_setting_ui,
    save_state_ui,
)
from ui_components.pose import reload_button_ui


def app():
    settings_to_refresh: Dict[str, Any] = {}

    with st.sidebar:
        session_meta_exists = load_session_meta_data()
        if session_meta_exists:
            base_save_dir = Path(st.session_state["session_meta"]["session_path"])
        else:
            base_save_dir = None

        st.markdown("""---""")
        use_two_cam: bool = st.checkbox("Use two cam", value=True)

        settings_to_refresh.update(
            {
                "reset_button": st.button("Reset Pose and Start Training Set"),
                "uploaded_pose_file": st.file_uploader("Load example pose file (.pkl)", type="pkl"),
                "model_settings": model_setting_ui(),
                "save_state": save_state_ui(),
                # TODO: save_settings = save_setting_ui(session_meta_exists=session_meta_exists)
                "rep_count_settings": rep_count_setting_ui(),
                "display_settings": display_setting_ui(),
                "reload_pose": reload_button_ui,
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
            video_processor_factory=lambda: PoseProcessor(**settings_to_refresh),
        )

    def _gen_and_refresh_webrtc_ctx(key: str):
        webrtc_ctx = gen_webrtc_ctx(key=key)
        if base_save_dir is not None:
            settings_to_refresh.update(_gen_save_paths(base_save_dir=base_save_dir, key=key))
        if webrtc_ctx.video_processor:
            _update_video_processor(webrtc_ctx.video_processor, settings_to_refresh)

    main_col, sub_col = st.columns(2)

    with main_col:
        _gen_and_refresh_webrtc_ctx(key="front")
    if use_two_cam:
        with sub_col:
            _gen_and_refresh_webrtc_ctx(key="side")


def _update_video_processor(vp, to_refresh: Dict[str, Any]) -> None:
    for key, val in to_refresh.items():
        assert hasattr(vp, key)
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
