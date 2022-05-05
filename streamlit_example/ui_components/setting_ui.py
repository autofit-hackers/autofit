import json
from email.policy import default
from pathlib import Path
from typing import Union

import streamlit as st
from utils.class_objects import (
    DisplaySettings,
    ModelSettings,
    RepCountSettings,
    SaveStates,
)


def model_setting_ui() -> ModelSettings:
    with st.expander("Model parameters (there parameters are effective only at initialization)"):
        model_complexity = st.radio("Model complexity", [0, 1, 2], index=0)
        min_detection_confidence = st.slider(
            "Min detection confidence",
            min_value=0.0,
            max_value=1.0,
            value=0.5,
            step=0.01,
        )
        min_tracking_confidence = st.slider(
            "Min tracking confidence",
            min_value=0.0,
            max_value=1.0,
            value=0.5,
            step=0.01,
        )
    return ModelSettings(
        model_complexity=model_complexity,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )


def display_setting_ui() -> DisplaySettings:
    with st.expander("Display settings"):
        return DisplaySettings(
            rotate_webcam_input=st.checkbox("Rotate webcam input", value=True),
            show_2d=st.checkbox("Show 2D", value=True),
            show_fps=st.checkbox("Show FPS", value=True),
        )


def rep_count_setting_ui() -> RepCountSettings:
    with st.expander("Rep counter settings"):
        return RepCountSettings(
            do_count_rep=st.checkbox("Count rep", value=True),
            upper_thresh=st.slider("upper_threshold", min_value=0.0, max_value=1.0, value=0.9, step=0.01),
            lower_thresh=st.slider("lower_threshold", min_value=0.0, max_value=1.0, value=0.8, step=0.01),
        )


def _stateful_bool_button(key: str) -> bool:
    _state: bool
    left_col, right_col = st.columns([1, 1])
    with left_col:
        _state = st.button("Start", key=key)
    with right_col:
        _state = not st.button("Stop", key="reverse_" + key)
    return _state


def save_state_ui() -> SaveStates:
    st.markdown("## Save")
    do_save_video = st.checkbox("Video", key="do_save_video_button", value=True)
    do_save_pose = st.checkbox("Pose", key="do_save_pose_button", value=True)

    is_saving = _stateful_bool_button("is_saving_button")

    return SaveStates(is_saving_video=(is_saving and do_save_video), is_saving_pose=(is_saving and do_save_pose))
