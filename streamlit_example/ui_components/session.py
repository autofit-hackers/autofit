import json
from dataclasses import asdict
from typing import Any, Union

import streamlit as st
from utils.class_objects import CameraInfo, SessionInfo


def session_info_ui() -> Union[SessionInfo, None]:
    st.markdown("---")
    session_info_json = st.file_uploader("Select Session Meta File (.json)", type="json")
    if session_info_json:
        session_info = SessionInfo(**json.load(session_info_json))
        st.session_state["session_info"] = session_info
        st.json(asdict(session_info))
        return SessionInfo(
            session_dir_path=session_info.session_dir_path,
            camera_dir_path=session_info.camera_dir_path,
            created_at=session_info.created_at,
            user_name=session_info.user_name,
        )


def camera_info_ui() -> Union[CameraInfo, None]:
    st.markdown("---")
    camera_info_json = st.file_uploader("Select Camera Info Meta File (.json)", type="json")
    if camera_info_json:
        camera_info = CameraInfo(**json.load(camera_info_json))
        st.session_state["session_info"] = camera_info
        st.json(asdict(camera_info))
        return CameraInfo(
            camera_dir_path=camera_info.camera_dir_path,
            camera_names=camera_info.camera_names,
            created_at=camera_info.created_at,
            used_in=camera_info.used_in,
        )
