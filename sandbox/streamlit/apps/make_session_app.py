import datetime
import json
import os

import cv2
from soupsieve import select
import streamlit as st


def app():
    user_name = st.text_input("User Name")
    camera_meta_json = st.file_uploader("Select Camera Info", type="json")
    make_dir = st.button("Make Directory", disabled=((camera_meta_json is None) or (user_name == "")))

    if make_dir and camera_meta_json:
        session_date = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M")
        session_name = session_date + "_" + user_name
        session_meta = dict()
        session_meta["session_path"] = f"data/session/{session_name}"
        session_meta["created_at"] = session_date
        session_meta["user_name"] = user_name
        camera_meta = json.load(camera_meta_json)
        session_meta["camera_info_path"] = camera_meta["camera_info_path"]
        st.session_state["session_meta"] = session_meta

        os.makedirs(f"data/session/{session_name}", exist_ok=True)
        with open(f"data/session/{session_name}/session_meta.json", "w") as f:
            json.dump(session_meta, f)

        camera_meta["used_in"].append(session_meta["session_path"])
        camera_path = camera_meta["camera_info_path"]
        with open(f"{camera_path}/camera_meta.json", "w") as f:
            json.dump(camera_meta, f)

        st.markdown("---")
        st.title("session_meta")
        st.json(session_meta)
        st.title("camera_meta")
        st.json(camera_meta)
        make_dir = False


if __name__ == "__main__":
    app()
