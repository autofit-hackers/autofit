import json
import time
from pathlib import Path
from typing import Dict, Any, List
from cv2 import add
from lib.pose.pose import PoseLandmarksObject

import numpy as np
import plotly.graph_objs as go
import streamlit as st
from apps.pose_visualization import visualize_pose
from processor.get_physical_info_processor import GetPhysicalInfoProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from lib.streamlit_ui.session import load_session_meta_data
from lib.streamlit_ui.setting_ui import display_setting_ui, model_setting_ui
from lib.webrtc_ui.calib_cam import DLT, get_projection_matrix


def app():
    settings_to_refresh: Dict[str, Any] = {}

    with st.sidebar:
        session_meta_exists = load_session_meta_data()
        if session_meta_exists:
            base_save_dir = Path(st.session_state["session_meta"]["session_path"])
        else:
            base_save_dir = None

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
            "image_save_path": str(base_save_dir / "skeleton" / f"{key}.jpg"),
        }

    main_col, sub_col = st.columns(2)

    with main_col:
        webrtc_front = _gen_and_refresh_webrtc_ctx(key="front")
    with sub_col:
        webrtc_side = _gen_and_refresh_webrtc_ctx(key="side")

    if (
        settings_to_refresh["is_clicked_capture_skeleton"]
        and webrtc_front.video_processor
        and webrtc_side.video_processor
    ):
        camera_info_path = Path(st.session_state["session_meta"]["camera_info_path"])
        pose = reconstruct_one_shot(
            webrtc_front.video_processor.result_pose, webrtc_side.video_processor.result_pose, camera_info_path
        )[0]
        pose.save_bone_lengths(Path(st.session_state["session_meta"]["session_path"]) / "skeleton" / "3d.json")
        visualize_pose([pose.landmark])

        col_f, col_s = st.columns(2)
        with col_f:
            visualize_pose([webrtc_front.video_processor.result_pose.landmark])
        with col_s:
            visualize_pose([webrtc_side.video_processor.result_pose.landmark])


if __name__ == "__main__":
    app()


def reconstruct_one_shot(
    landmarks_front: PoseLandmarksObject, landmarks_side: PoseLandmarksObject, camera_info_path
) -> List[PoseLandmarksObject]:
    projection_matrix_front = get_projection_matrix(camera_info_path, "front")
    projection_matrix_side = get_projection_matrix(camera_info_path, "side")
    return reconstruct_pose_3d_array(
        [landmarks_front], [landmarks_side], projection_matrix_front, projection_matrix_side
    )


def reconstruct_pose_3d_array(
    poses_front: List[PoseLandmarksObject],
    landmarks_side: List[PoseLandmarksObject],
    projection_matrix_front: np.ndarray,
    projection_matrix_side: np.ndarray,
) -> List[PoseLandmarksObject]:
    pose_3d = []
    for pose_front, pose_side in zip(poses_front, landmarks_side):
        landmark_3d = []
        for uv1, uv2 in zip(pose_front.landmark, pose_side.landmark):
            if uv1[0] == -1 or uv2[0] == -1:
                _p3d = [-1, -1, -1]
            else:
                _p3d = DLT(projection_matrix_front, projection_matrix_side, uv1, uv2)
            landmark_3d.append(_p3d)

        landmark_3d = np.array(landmark_3d)
        landmark_3d = (
            landmark_3d - (landmark_3d[10, :] + landmark_3d[11, :]) / 2 + [0, 0, 0]
        )  # set the center of feet to [0, 0, 50]
        pose_3d.append(
            PoseLandmarksObject(
                landmark_3d, np.add(pose_front.visibility, pose_side.visibility) / 2, pose_front.timestamp
            )
        )

    assert len(pose_3d) == len(poses_front), "len of landmarks3d differs from 2d"
    return pose_3d


def draw_3d_plot(X, Y, Z, title=""):
    # レイアウトの設定
    layout = go.Layout(
        title=title,
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
