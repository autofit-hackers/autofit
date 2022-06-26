from typing import Dict, Any
from processor.auto_processor import AutoProcessor

import streamlit as st
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from lib.streamlit_ui.setting_ui import (
    display_setting_ui,
    model_setting_ui,
    rep_count_setting_ui,
    audio_setting_ui,
)


def app():
    settings_to_refresh: Dict[str, Any] = {}

    with st.sidebar:
        st.markdown("---")
        st.markdown("## Settings")
        settings_to_refresh.update(
            {
                "display_settings": display_setting_ui(),
                "audio_settings": audio_setting_ui(),
                "model_settings": model_setting_ui(),
                "rep_count_settings": rep_count_setting_ui(),
            }
        )

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=lambda: AutoProcessor(**settings_to_refresh),
        )

    def _gen_and_refresh_webrtc_ctx(key: str):
        webrtc_ctx = gen_webrtc_ctx(key=key)
        if webrtc_ctx.video_processor:
            _update_video_processor(webrtc_ctx.video_processor, settings_to_refresh)
        return webrtc_ctx

    _gen_and_refresh_webrtc_ctx(key="front")


def _update_video_processor(vp, to_refresh: Dict[str, Any]) -> None:
    for key, val in to_refresh.items():
        # assert hasattr(vp, key), f"{key}"
        vp.__dict__[key] = val
    return


if __name__ == "__main__":
    app()
