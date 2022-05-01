from pathlib import Path

import streamlit as st
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, SaveSettings, SaveStates


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


def _stateful_bool_button(key: str) -> bool:
    _state: bool
    _state = st.button("Start", key=key)
    _state = not st.button("Stop", key="reverse_" + key)
    return _state


def save_state_ui() -> SaveStates:
    st.markdown("### Video saving")
    is_saving_video = _stateful_bool_button("is_saving_video_button")
    print("is_saving_video", is_saving_video)

    st.markdown("### Pose saving")
    is_saving_pose = _stateful_bool_button("is_saving_pose_button")

    return SaveStates(is_saving_video=is_saving_video, is_saving_pose=is_saving_pose)


# TODO: use ui component in pose_app
def save_setting_ui(session_meta_exists: bool) -> SaveSettings:
    # save_video = st.checkbox("Start Video", value=False)
    st.markdown("### Video saving")
    is_saving_video = st.button("Start", key="is_saving_video")

    # save_pose = st.checkbox("Save Pose", value=False)
    st.markdown("### Pose saving")
    is_saving_video = st.button("Start", key="is_saving_video")

    if session_meta_exists:
        base_save_dir = Path(st.session_state["session_meta"]["session_path"])
        video_save_dir = base_save_dir / "video"
        video_save_dir.mkdir(parents=True, exist_ok=True)
        pose_save_dir = base_save_dir / "pose"
        pose_save_dir.mkdir(parents=True, exist_ok=True)
    else:
        video_save_dir, pose_save_dir = None, None

    return SaveSettings()
