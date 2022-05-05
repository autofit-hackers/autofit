import json
import os
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

import streamlit as st
from soupsieve import select
from ui_components import camera_info_ui, session_info_ui
from utils import CameraInfo, SessionInfo


def app():
    user_name = st.text_input("User Name")
    camera_info = camera_info_ui()
    make_dir = st.button("Make Session", disabled=((camera_info is None) or (user_name == "")))

    if make_dir and camera_info is not None:
        created_at = datetime.now().strftime("%Y-%m-%d-%H-%M")
        session_dir_path = f"data/session/{created_at}_{user_name}"
        session_info = SessionInfo(
            session_dir_path=session_dir_path,
            camera_dir_path=camera_info.camera_dir_path,
            created_at=created_at,
            user_name=user_name,
        )
        os.makedirs(session_dir_path, exist_ok=True)
        with open(f"{session_dir_path}/session_info.json", "w") as f:
            json.dump(asdict(session_info), f)

        # record this session path in camera info.json
        camera_info.used_in.append(session_dir_path)
        with open(f"{camera_info.camera_dir_path}/camera_info.json", "w") as f:
            json.dump(asdict(camera_info), f)

        st.markdown("---")
        st.title("session_info")
        st.json(asdict(session_info))
        st.title("camera_info")
        st.json(asdict(camera_info))


if __name__ == "__main__":
    app()
