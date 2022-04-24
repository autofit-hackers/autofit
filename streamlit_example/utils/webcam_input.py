import streamlit as st
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer


def build_webcam_streams(processor, key: str):
    return webrtc_streamer(
            key=key,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=processor
        )
    
