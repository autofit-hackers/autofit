import time
from pathlib import Path
from typing import List, Union
from matplotlib import pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np

import streamlit as st
from processor import PoseProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from processor.get_physical_info_processor import GetPhysicalInfoProcessor

from utils.class_objects import ModelSettings, DisplaySettings


def app():
    capture_skeleton = False
    if st.button("Save Screen Capture"):
        capture_skeleton = True
    else:
        capture_skeleton = False

    with st.sidebar:
        st.markdown("""---""")

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

        with st.expander("Display settings"):
            rotate_webcam_input = st.checkbox("Rotate webcam input", value=False)
            show_fps = st.checkbox("Show FPS", value=True)
            show_2d = st.checkbox("Show 2D", value=True)
            display_settings = DisplaySettings(
                rotate_webcam_input=rotate_webcam_input,
                show_2d=show_2d,
                show_fps=show_fps,
            )

    now_str: str = time.strftime("%Y-%m-%d-%H-%M-%S")

    def processor_factory():
        return GetPhysicalInfoProcessor(
            model_settings=model_settings,
            display_settings=display_settings,
            capture_skeleton=capture_skeleton,
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

    # NOTE: 動的に監視したい変数以外は以下に含める必要なし?
    # NOTE: mainとsubをカメラ構造体or辞書にまとめる?

    main_col, sub_col = st.columns(2)

    with main_col:
        webrtc_ctx_main = gen_webrtc_ctx(key="posefit_main_cam")
        st.session_state["started"] = webrtc_ctx_main.state.playing
        if webrtc_ctx_main.video_processor:
            cam_type: str = "main"
            webrtc_ctx_main.video_processor.display_settings = display_settings
            webrtc_ctx_main.video_processor.skeleton_save_path = str(
                Path("skeletons") / f"{now_str}_{cam_type}_cam.jpg"
            )
            webrtc_ctx_main.video_processor.capture_skeleton = capture_skeleton

    with sub_col:
        webrtc_ctx_sub = gen_webrtc_ctx(key="posefit_sub_cam")
        if webrtc_ctx_sub.video_processor:
            cam_type: str = "sub"
            webrtc_ctx_sub.video_processor.display_settings = display_settings
            webrtc_ctx_sub.video_processor.skeleton_save_path = str(
                Path("skeletons") / f"{now_str}_{cam_type}_cam.jpg"
            )
            webrtc_ctx_sub.video_processor.capture_skeleton = capture_skeleton

    # # 描画領域を用意する
    # fig = plt.figure()
    # ax = fig.add_subplot()
    # # ランダムな値をヒストグラムとしてプロットする
    # x = np.random.normal(loc=0.0, scale=1.0, size=(100,))
    # ax.hist(x, bins=20)
    # # Matplotlib の Figure を指定して可視化する
    # st.pyplot(fig)

    if capture_skeleton and webrtc_ctx_main.video_processor.result_pose is not None:
        X = webrtc_ctx_main.video_processor.result_pose.landmark[:, 0]
        Y = 1 - webrtc_ctx_main.video_processor.result_pose.landmark[:, 1]
        Z = webrtc_ctx_main.video_processor.result_pose.landmark[:, 2]
        # グラフの枠を作成
        fig = plt.figure()
        ax = Axes3D(fig)
        # X,Y,Z軸にラベルを設定
        ax.set_xlabel("X")
        ax.set_ylabel("Y")
        ax.set_zlabel("Z")
        # .plotで描画
        ax.plot(X, Z, Y, marker="o", linestyle="None")
        # 最後に.show()を書いてグラフ表示
        st.pyplot(fig)

        # figureを生成する
        fig2 = plt.figure()
        # axをfigureに設定する
        ax = fig2.add_subplot()
        # axesに散布図を設定する
        ax.scatter(X, Y, c="b")
        # 表示する
        st.pyplot(fig2)


if __name__ == "__main__":
    app()
