import datetime
import json
import os
from io import StringIO
from pathlib import Path
from typing import List, Union

import cv2 as cv
import streamlit as st


def app():
    user_name = st.text_input("User Name")
    session_date = datetime.datetime.now().strftime("%Y-%m-%d-%H-%M")
    session_name = user_name + session_date
    camera_meta_json = st.file_uploader("Select Camera Info", type="json")
    make_dir = st.button("Make Directory")

    if make_dir and camera_meta_json:
        session_meta = dict()
        session_meta["session_path"] = f"data/session/{session_name}"
        session_meta["created_at"] = session_date
        session_meta["user_name"] = user_name
        camera_meta = json.load(camera_meta_json)
        session_meta["camera_info_path"] = camera_meta["camera_info_path"]

        os.makedirs(f"data/session/{session_name}", exist_ok=True)
        with open(f"data/session/{session_name}/meta.json", "w") as f:
            json.dump(session_meta, f)

        st.json(session_meta)
        make_dir = False


if __name__ == "__main__":
    app()
