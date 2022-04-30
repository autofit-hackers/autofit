import streamlit as st
from utils.class_objects import ModelSettings, DisplaySettings, RepCountSettings


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
            rotate_webcam_input=st.checkbox("Rotate webcam input", value=False),
            show_2d=st.checkbox("Show FPS", value=True),
            show_fps=st.checkbox("Show 2D", value=True),
        )


def rep_count_setting_ui() -> RepCountSettings:
    with st.expander("Rep counter settings"):
        return RepCountSettings(
            do_count_rep=st.checkbox("Count rep", value=True),
            upper_thresh=st.slider("upper_threshold", min_value=0.0, max_value=1.0, value=0.9, step=0.01),
            lower_thresh=st.slider("lower_threshold", min_value=0.0, max_value=1.0, value=0.8, step=0.01),
        )
