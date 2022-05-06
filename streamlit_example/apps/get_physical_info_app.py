import json
import time
from pathlib import Path
from typing import List, Union, Dict, Any

import numpy as np
import plotly.figure_factory as ff
import plotly.graph_objs as go
import streamlit as st
from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from processor.get_physical_info_processor import GetPhysicalInfoProcessor
from pylibsrtp import Session
from requests import session
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from ui_components.session import load_session_meta_data
from ui_components.setting_ui import display_setting_ui, model_setting_ui
from utils.class_objects import DisplaySettings, ModelSettings


def app():
    settings_to_refresh: Dict[str, Any] = {}

    with st.sidebar:
        session_meta_exists = load_session_meta_data()
        if session_meta_exists:
            base_save_dir = Path(st.session_state["session_meta"]["session_path"])
        else:
            base_save_dir = None

        st.markdown("""---""")

        settings_to_refresh.update(
            {
                "model_settings": model_setting_ui(),
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
            video_processor_factory=lambda: GetPhysicalInfoProcessor(**settings_to_refresh),
        )

    def _gen_and_refresh_webrtc_ctx(key: str):
        webrtc_ctx = gen_webrtc_ctx(key=key)
        if base_save_dir is not None:
            settings_to_refresh.update(_gen_save_paths(base_save_dir=base_save_dir, key=key))
        if webrtc_ctx.video_processor:
            _update_video_processor(webrtc_ctx.video_processor, settings_to_refresh)
        return webrtc_ctx

    def _update_video_processor(vp, to_refresh: Dict[str, Any]) -> None:
        for key, val in to_refresh.items():
            assert hasattr(vp, key), f"{key}"
            vp.__dict__[key] = val
        return

    def _gen_save_paths(base_save_dir: Path, key: str) -> Dict[str, str]:
        st.write(str(base_save_dir))
        return {
            "skeleton_save_path": str(base_save_dir / "skeleton" / f"{key}.json"),
            "image_save_path": str(base_save_dir / "skeleton" / f"{key}.jpg"),
        }

    main_col, sub_col = st.columns(2)

    with main_col:
        webrtc_ctx_main = _gen_and_refresh_webrtc_ctx(key="front")
    with sub_col:
        webrtc_ctx_sub = _gen_and_refresh_webrtc_ctx(key="side")

    if settings_to_refresh["is_clicked_capture_skeleton"] and webrtc_ctx_main.video_processor is not None:
        X = webrtc_ctx_main.video_processor.result_pose.landmark[:, 0]
        Y = 1 - webrtc_ctx_main.video_processor.result_pose.landmark[:, 1]
        Z = webrtc_ctx_main.video_processor.result_pose.landmark[:, 2]

        # レイアウトの設定
        layout = go.Layout(
            title=st.session_state["session_meta"]["user_name"] + " さんの骨格",
            template="ggplot2",
            autosize=True,
            scene=dict(
                aspectmode="manual",
                aspectratio=dict(x=1, y=1, z=1),
                xaxis=dict(range=[-3, 3], title="x"),
                yaxis=dict(range=[-3, 3], title="y"),
                zaxis=dict(range=[-3, 3], title="z"),
                camera=dict(eye=dict(x=1.5, y=0.9, z=0.7)),  # カメラの角度
            ),
        )

        data = go.Scatter3d(
            x=X,
            y=Y,
            z=Z,
            mode="lines+markers",
            marker=dict(size=2.5, color="red"),
            line=dict(color="red", width=2),
        )

        fig = dict(data=data, layout=layout)
        st.plotly_chart(fig)


if __name__ == "__main__":
    app()
