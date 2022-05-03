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

from apps.visualize_pose import visualize_pose


def reconstruct_pose_3d(landmarks_front, landmarks_side, projection_matrix_front, projection_matrix_side):
    landmarks_3d = []
    for landmark_front, landmark_side in zip(landmarks_front, landmarks_side):
        landmark_3d = []
        for uv1, uv2 in zip(landmark_front, landmark_side):
            if uv1[0] == -1 or uv2[0] == -1:
                _p3d = [-1, -1, -1]
            else:
                _p3d = DLT(projection_matrix_front, projection_matrix_side, uv1, uv2)
            landmark_3d.append(_p3d)

        landmark_3d = np.array(landmark_3d)
        landmark_3d = (
            landmark_3d - (landmark_3d[10, :] + landmark_3d[11, :]) / 2 + [0, 0, 50]
        )  # set the center of feet to [0, 0, 50]
        landmarks_3d.append(landmark_3d)

    assert len(landmarks_3d) == len(landmarks_front), "len of landmarks3d differs from 2d"
    return landmarks_3d


def app():
    # User input
    with st.sidebar:
        session_meta_file = st.file_uploader("Select Session")
        start_reconstruction = st.button("Reconstruct and Vizualize 3D Pose", disabled=not session_meta_file)

    # Load uploaded poses and reconstruct 3D pose from them
    if start_reconstruction and session_meta_file:
        session_meta = json.load(session_meta_file)
        session_path = session_meta["session_path"]
        camera_info_path = Path(session_meta["camera_info_path"])
        with open(Path(f"{session_path}/pose/front.pkl"), "rb") as f:
            poses_front = pickle.load(f)
            landmarks_front = [pose.landmark for pose in poses_front]
        with open(Path(f"{session_path}/pose/side.pkl"), "rb") as f:
            poses_side = pickle.load(f)
            landmarks_side = [pose.landmark for pose in poses_side]

        projection_matrix_front = get_projection_matrix(camera_info_path, "front")
        projection_matrix_side = get_projection_matrix(camera_info_path, "side")

        landmarks_3d = reconstruct_pose_3d(
            landmarks_front=landmarks_front,
            landmarks_side=landmarks_side,
            projection_matrix_front=projection_matrix_front,
            projection_matrix_side=projection_matrix_side,
        )
        with open(Path(f"{camera_info_path}/reconstructed3d.pkl"), "wb") as f:
            pickle.dump(landmarks_3d, f)
        st.write("3D Pose reconstruction finished!")

        visualize_pose(landmarks_3d)


if __name__ == "__main__":
    app()
