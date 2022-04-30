import streamlit as st
from utils.class_objects import ModelSettings, DisplaySettings


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
        model_settings = ModelSettings(
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
    return model_settings


def display_setting_ui() -> DisplaySettings:
    with st.expander("Display settings"):
        rotate_webcam_input = st.checkbox("Rotate webcam input", value=False)
        show_fps = st.checkbox("Show FPS", value=True)
        show_2d = st.checkbox("Show 2D", value=True)
        display_settings = DisplaySettings(
            rotate_webcam_input=rotate_webcam_input,
            show_2d=show_2d,
            show_fps=show_fps,
        )
    return display_settings
