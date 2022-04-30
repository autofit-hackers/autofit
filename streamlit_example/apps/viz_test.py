import datetime
import json
import os
import pickle
import sys
import time
from io import StringIO
from pathlib import Path
from typing import List, Type, Union

import cv2 as cv
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from mpl_toolkits.mplot3d import Axes3D
from soupsieve import select
from utils import DLT, PoseLandmarksObject, get_projection_matrix


def pose3d_reconstruction(landmarks_front, landmarks_side, projection_matrix_front, projection_matrix_side):
    assert len(landmarks_front) == len(landmarks_side), "len of landmarks differs among cameras"
    landmarks3d = []
    for landmark_front, landmark_side in zip(landmarks_front, landmarks_side):
        landmark3d = []
        for uv1, uv2 in zip(landmark_front, landmark_side):
            if uv1[0] == -1 or uv2[0] == -1:
                _p3d = [-1, -1, -1]
            else:
                _p3d = DLT(projection_matrix_front, projection_matrix_side, uv1, uv2)
            landmark3d.append(_p3d)

        landmark3d = np.array(landmark3d)
        landmark3d = (
            landmark3d - (landmark3d[10, :] + landmark3d[11, :]) / 2 + [0, 0, 50]
        )  # set the center of feet to [0, 0, 50]
        landmarks3d.append(landmark3d)

    assert len(landmarks3d) == len(landmarks_front), "len of landmarks3d differs from 2d"
    return landmarks3d


def visualize_pose3d(landmarks3d):
    number_frames = len(landmarks3d)
    # ラベル
    d_time = np.array([str(x) + "frame" for x in range(number_frames)], dtype="O")

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
        autosize=False,
        width=1000,
        height=800,
        scene=dict(
            aspectmode="manual",
            aspectratio=dict(x=1, y=1, z=1),  # アスペクト比
            xaxis=dict(range=[-4, 4], title="x方向"),  # x軸の範囲
            yaxis=dict(range=[-4, 4], title="y方向"),  # y軸の範囲
            zaxis=dict(range=[-20, 20], title="z方向"),  # z軸の範囲
            camera=dict(eye=dict(x=1.5, y=0.9, z=0.7)),
        ),  # カメラの角度
        # font = dict(color="#fff"),
        updatemenus=updatemenus,  # 上で設定したアップデートを設置
        sliders=sliders,  # 上で設定したスライダーを設置
    )

    data = go.Scatter3d(
        x=landmarks3d[0][:, 0],
        y=landmarks3d[0][:, 1],
        z=landmarks3d[0][:, 2],
        mode="lines+markers",
        marker=dict(size=2.5, color="red"),
        line=dict(color="red", width=2),
    )

    frames = []
    for frame in range(number_frames):
        pose3d_scatter = go.Scatter3d(
            x=landmarks3d[frame][:, 0],
            y=landmarks3d[frame][:, 1],
            z=landmarks3d[frame][:, 2],
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
    plt.style.use("seaborn")

    with st.sidebar:
        pose_file = st.file_uploader("Select Pose File")
        start_reconstruction = st.button("Reconstruct and Vizualize 3D Pose", disabled=not pose_file)

    if start_reconstruction and pose_file:
        poses_3d = pickle.load(pose_file)
        landmarks_3d = [pose.landmark for pose in poses_3d]

        visualize_pose3d(landmarks_3d)


if __name__ == "__main__":
    app()
