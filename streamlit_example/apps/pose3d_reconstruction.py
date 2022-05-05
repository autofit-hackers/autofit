import json
import pickle
from pathlib import Path

import numpy as np
import streamlit as st
from utils import DLT, PoseLandmarksObject, get_projection_matrix

from apps.pose_visualization import visualize_pose


def reconstruct_pose_3d(session_path, camera_info_path):
    with open(Path(f"{session_path}/pose/front.pkl"), "rb") as f:
        poses_front = pickle.load(f)
        landmarks_front = [pose.landmark for pose in poses_front]
    with open(Path(f"{session_path}/pose/side.pkl"), "rb") as f:
        poses_side = pickle.load(f)
        landmarks_side = [pose.landmark for pose in poses_side]
    projection_matrix_front = get_projection_matrix(camera_info_path, "front")
    projection_matrix_side = get_projection_matrix(camera_info_path, "side")

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
            landmark_3d - (landmark_3d[10, :] + landmark_3d[11, :]) / 2 + [0, 0, 0]
        )  # set the center of feet to [0, 0, 50]
        landmarks_3d.append(landmark_3d)

    assert len(landmarks_3d) == len(landmarks_front), "len of landmarks3d differs from 2d"
    return landmarks_3d


def app():
    # User input
    with st.sidebar:
        session_info_file = st.file_uploader("Select Session meta.json")
        start_reconstruction = st.button("Reconstruct and Vizualize 3D Pose", disabled=not session_info_file)

    # Load uploaded poses and reconstruct 3D pose from them
    if start_reconstruction and session_info_file:
        session_info = json.load(session_info_file)
        session_path = session_info["session_path"]
        camera_info_path = Path(session_info["camera_info_path"])

        reconstructed_landmarks = reconstruct_pose_3d(session_path=session_path, camera_info_path=camera_info_path)
        reconstructed_pose = [
            PoseLandmarksObject(landmark=landmark, visibility=visibility)
            for landmark, visibility in zip(
                reconstructed_landmarks,
                np.ones(shape=(len(reconstructed_landmarks), 33, 1)),
            )
        ]
        with open(Path(f"{session_path}/pose/reconstructed3d.pkl"), "wb") as f:
            pickle.dump(reconstructed_pose, f)
        st.write("Reconstructed 3D Pose has been saved!")

        visualize_pose(reconstructed_landmarks)


if __name__ == "__main__":
    app()
