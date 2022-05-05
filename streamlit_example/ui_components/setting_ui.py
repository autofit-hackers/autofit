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
    st.markdown("---")
    st.markdown("## Other Settings")
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


def save_state_ui() -> bool:
    st.markdown("---")
    st.markdown("## Save")

    is_saving = False
    left_col, right_col = st.columns(2)
    with left_col:
        if st.button("Start"):
            is_saving = True
    with right_col:
        if st.button("Stop"):
            is_saving = False
    st.write(is_saving)

    return True
