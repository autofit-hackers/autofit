import os
import pickle
from pathlib import Path

import numpy as np
import plotly.graph_objects as go
import streamlit as st
from soupsieve import select
from utils import DLT, PoseLandmarksObject, get_projection_matrix


# TODO: 自動再生中もグリグリできるようにする
def visualize_pose(landmarks_3d):
    st.write(landmarks_3d)
    num_frames = len(landmarks_3d)
    # ラベル
    d_time = np.array([str(x) + "frame" for x in range(num_frames)], dtype="O")

    # スライダーの設定
    sliders = [
        dict(
            steps=[
                dict(
                    method="animate",
                    args=[
                        [risk_rate],
                        dict(mode="immediate", frame=dict(duration=10, redraw=True), transition=dict(duration=0)),
                    ],
                    label=risk_rate,
                )
                for risk_rate in d_time
            ],  # ラベルを設定
            transition=dict(duration=0),
            x=0,
            y=0,
            currentvalue=dict(font=dict(size=12), prefix="", visible=True, xanchor="center"),
            len=1.0,
        )
    ]

    # アップデートの設定
    updatemenus = [
        dict(
            type="buttons",
            showactive=False,
            y=1,
            x=-0.05,
            xanchor="right",
            yanchor="top",
            pad=dict(t=0, r=10),
            buttons=[
                dict(
                    label="Play",  # 再生ボタン
                    method="animate",
                    args=[
                        None,
                        dict(
                            frame=dict(duration=10, redraw=True),  # 再生の速度
                            transition=dict(duration=0),  # このdurationはよくわからない
                            fromcurrent=True,
                            mode="immediate",
                        ),
                    ],
                ),
                dict(args=[[None], dict(mode="immediate", frame=dict(redraw=True))], label="Pause", method="animate"),
            ],
        )
    ]

    # レイアウトの設定
    layout = go.Layout(
        title="テストグラフ",
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
        # font = dict(color="#fff"),
        updatemenus=updatemenus,  # 上で設定したアップデートを設置
        sliders=sliders,  # 上で設定したスライダーを設置
    )

    data = go.Scatter3d(
        x=landmarks_3d[0][:, 0],
        y=landmarks_3d[0][:, 1],
        z=landmarks_3d[0][:, 2],
        mode="lines+markers",
        marker=dict(size=2.5, color="red"),
        line=dict(color="red", width=2),
    )

    frames = []
    for frame in range(num_frames):
        pose3d_scatter = go.Scatter3d(
            x=landmarks_3d[frame][:, 0],
            y=landmarks_3d[frame][:, 1],
            z=landmarks_3d[frame][:, 2],
            mode="lines+markers",
            marker=dict(size=2.5, color="red"),
            line=dict(color="red", width=2),
            text=d_time[frame],
        )
        data_k = pose3d_scatter
        frames.append(dict(data=data_k, name=d_time[frame]))

    fig = dict(data=data, layout=layout, frames=frames)
    st.plotly_chart(fig)


def app():
    # Initialize st.session_state
    if "start_visualize" not in st.session_state:
        st.session_state["start_visualize"] = False

    # User inputs
    with st.sidebar:
        pose_file = st.file_uploader("Select Pose File")
        start_visualize_2d = st.button("Vizualize Pose", disabled=not pose_file)
        trimmed_frame_start = st.number_input("Trim pose from frame:", min_value=0)
        trimmed_frame_end = st.number_input(
            "to frame:",
            min_value=trimmed_frame_start,
            disabled=not trimmed_frame_start,
        )
        save_trimmed_pose = st.button("Save Trimmed Pose", disabled=not trimmed_frame_end)

    # Update st.session_state to hold flags between page refresh
    if start_visualize_2d:
        st.session_state["start_visualize"] = True

    # Load uploaded pose and vizualize it
    if st.session_state["start_visualize"] and pose_file:
        uploaded_pose = pickle.load(pose_file)
        landmarks_3d = np.array([pose.landmark for pose in uploaded_pose])

        # Trim uploaded pose based on selected frame numbers
        if save_trimmed_pose:
            trimmed_pose_3d = [
                PoseLandmarksObject(landmark=landmark, visibility=visibility)
                for landmark, visibility in zip(
                    landmarks_3d[trimmed_frame_start : trimmed_frame_end + 1],
                    np.ones(shape=(int(trimmed_frame_end), 33, 1)),
                )
            ]
            os.makedirs("test_data")
            with open(Path(f"test_data/trimmed_pose.pkl"), "wb") as f:
                pickle.dump(trimmed_pose_3d, f)
            st.write("Trimmed Pose Successfully Saved!")

        visualize_pose(landmarks_3d)


if __name__ == "__main__":
    app()
