import os
import pickle
from pathlib import Path
from time import time
from unicodedata import name

import mediapipe as mp
import numpy as np
import plotly.graph_objects as go
import plotly.io as pio
import streamlit as st
from soupsieve import select
from utils import PoseLandmarksObject


# TODO: 自動再生中もグリグリできるようにする
def visualize_pose(landmarks):
    landmarks = np.array(landmarks)
    connections = mp.solutions.pose.POSE_CONNECTIONS  # type: ignore
    num_frames = landmarks.shape[0]
    num_frames = len(landmarks)
    camera_resolution = [1080, 1920]
    aspect_ratio = camera_resolution[0] / camera_resolution[1]
    # exchange x and y for good pose view
    landmarks = landmarks[:, :, [1, 0, 2]]

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
                        dict(mode="immediate", frame=dict(duration=0, redraw=True), transition=dict(duration=0)),
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
                            frame=dict(duration=0, redraw=True),  # 再生の速度
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
    range_min = min(landmarks[:, :, 0].min(), landmarks[:, :, 1].min(), landmarks[:, :, 2].min())
    range_max = max(landmarks[:, :, 0].max(), landmarks[:, :, 1].max(), landmarks[:, :, 2].max())
    _range = [range_min, range_max]

    layout = go.Layout(
        title="Pose",
        template="ggplot2",
        autosize=True,
        scene=dict(
            aspectmode="manual",
            aspectratio=dict(x=1, y=1, z=1),
            xaxis=dict(range=_range, title="x"),  # reverse range
            yaxis=dict(range=_range, title="y"),
            zaxis=dict(range=_range, title="z"),
            camera=dict(eye=dict(x=0, y=0, z=-2)),  # カメラの角度
        ),
        # font = dict(color="#fff"),
        updatemenus=updatemenus,  # 上で設定したアップデートを設置
        sliders=sliders,  # 上で設定したスライダーを設置
    )

    # Prepare connection data between landmarks
    out_connection_list = []
    for frame_idx in range(num_frames):
        out_connection = []
        for connection in connections:
            start_idx = connection[0]
            end_idx = connection[1]
            out_connection.append(
                dict(
                    x=[landmarks[frame_idx, start_idx, 0], landmarks[frame_idx, end_idx, 0]],
                    y=[landmarks[frame_idx, start_idx, 1], landmarks[frame_idx, end_idx, 1]],
                    z=[landmarks[frame_idx, start_idx, 2], landmarks[frame_idx, end_idx, 2]],
                )
            )
        out_connection_list.append(out_connection)

    out_connection_series = []
    for out_connection in out_connection_list:
        cn2 = {"x": [], "y": [], "z": []}
        for pair in out_connection:
            for k in pair.keys():
                cn2[k].append(pair[k][0])
                cn2[k].append(pair[k][1])
                cn2[k].append(None)
        out_connection_series.append(cn2)

    # Initial plot
    data = [
        go.Scatter3d(
            x=landmarks[0, :, 0],
            y=landmarks[0, :, 1],
            z=landmarks[0, :, 2],
            mode="markers",
            marker=dict(size=2.5, color="red"),
            name="landmarks",
        ),
        go.Scatter3d(
            x=out_connection_series[0]["x"],
            y=out_connection_series[0]["y"],
            z=out_connection_series[0]["z"],
            mode="lines",
            line={"color": "black", "width": 3},
            name="connections",
        ),
    ]

    frames = []
    for frame in range(num_frames):
        data_k = [
            go.Scatter3d(
                x=landmarks[frame, :, 0],
                y=landmarks[frame, :, 1],
                z=landmarks[frame, :, 2],
                mode="markers",
                marker=dict(size=2, color="red"),
                name="landmarks",
            ),
            go.Scatter3d(
                x=out_connection_series[frame]["x"],
                y=out_connection_series[frame]["y"],
                z=out_connection_series[frame]["z"],
                mode="lines",
                line={"color": "black", "width": 3},
                name="connections",
            ),
        ]
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
        start_visualize = st.button("Vizualize Pose", disabled=not pose_file)
        trimmed_frame_start = st.number_input("Trim pose from frame:", min_value=0)
        trimmed_frame_end = st.number_input(
            "to frame:",
            min_value=trimmed_frame_start,
            disabled=not trimmed_frame_start,
        )
        save_trimmed_pose = st.button("Save Trimmed Pose", disabled=not trimmed_frame_end)

    # Update st.session_state to hold flags between page refresh
    if start_visualize:
        st.session_state["start_visualize"] = True

    # Load uploaded pose and vizualize it
    if st.session_state["start_visualize"] and pose_file:
        uploaded_pose = pickle.load(pose_file)
        landmarks: list[np.ndarray] = [pose.landmark for pose in uploaded_pose]
        visibilities = [pose.visibility for pose in uploaded_pose]

        # Trim uploaded pose based on selected frame numbers
        if save_trimmed_pose:
            trimmed_pose = [
                PoseLandmarksObject(landmark=landmark, visibility=visibility, timestamp=None)
                for landmark, visibility in zip(
                    landmarks[trimmed_frame_start : trimmed_frame_end + 1],
                    visibilities[trimmed_frame_start : trimmed_frame_end + 1],
                )
            ]
            os.makedirs("test_data")
            with open(Path(f"test_data/trimmed_pose.pkl"), "wb") as f:
                pickle.dump(trimmed_pose, f)
            st.write("Trimmed Pose Successfully Saved!")

        visualize_pose(landmarks)


if __name__ == "__main__":
    app()
