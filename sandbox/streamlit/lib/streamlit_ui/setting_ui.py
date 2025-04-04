from pathlib import Path

import streamlit as st
import lib.streamlit_ui.setting_class as settings



def model_setting_ui() -> settings.ModelSettings:
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
    return settings.ModelSettings(
        model_complexity=model_complexity,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )


def display_setting_ui() -> settings.DisplaySettings:
    with st.expander("Display settings"):
        return settings.DisplaySettings(
            rotate_webcam_input=st.checkbox("Rotate webcam input", value=True),
            show_2d=st.checkbox("Show 2D", value=True),
            show_fps=st.checkbox("Show FPS", value=True),
            correct_distortion=st.checkbox("Correct distortion", value=False),
        )


def rep_count_setting_ui() -> settings.RepCountSettings:
    with st.expander("Rep counter settings"):
        return settings.RepCountSettings(
            do_count_rep=st.checkbox("Count rep", value=True),
            upper_thresh=st.slider("upper_threshold", min_value=0.0, max_value=1.0, value=0.9, step=0.01),
            lower_thresh=st.slider("lower_threshold", min_value=0.0, max_value=1.0, value=0.8, step=0.01),
        )


def audio_setting_ui() -> settings.AudioSettings:
    with st.expander("Audio settings"):
        return settings.AudioSettings(
            play_audio=st.checkbox("Play Audio", value=False),
            audio_device_id=int(st.number_input("Device Id", min_value=0, format="%d")),
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

    return is_saving


# TODO: use ui component in pose_app
def save_setting_ui(session_meta_exists: bool) -> settings.SaveSettings:
    st.markdown("### Video saving")
    is_saving_video = st.button("Start", key="is_saving_video")

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

    return settings.SaveSettings()
