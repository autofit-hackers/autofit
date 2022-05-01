from curses import meta
from pathlib import Path

import streamlit as st
from processor import PoseProcessor
from streamlit_webrtc import ClientSettings, WebRtcMode, webrtc_streamer
from ui_components.session import load_session_meta_data
from ui_components.setting_ui import display_setting_ui, model_setting_ui, rep_count_setting_ui, save_state_ui


def app():
    reset_button = st.button("Reset Pose and Start Training Set")

    # session_meta = st.session_state["session_meta"]
    # st.json(session_meta)

    with st.sidebar:
        session_meta_exists = load_session_meta_data()

        st.markdown("""---""")
        uploaded_pose_file = st.file_uploader("Load example pose file (.pkl)", type="pkl")
        use_two_cam: bool = st.checkbox("Use two cam", value=False)

        model_settings = model_setting_ui()
        # TODO: save_settings = save_setting_ui(session_meta_exists=session_meta_exists)
        save_state = save_state_ui()
        rep_count_settings = rep_count_setting_ui()
        display_settings = display_setting_ui()

        if st.button("RELOAD"):
            reload_pose = True
            st.write("RELOADED")
        else:
            reload_pose = False

    if session_meta_exists:
        base_save_dir = Path(st.session_state["session_meta"]["session_path"])
        video_save_dir = base_save_dir / "video"
        video_save_dir.mkdir(parents=True, exist_ok=True)
        pose_save_dir = base_save_dir / "pose"
        pose_save_dir.mkdir(parents=True, exist_ok=True)
    else:
        video_save_dir, pose_save_dir = None, None

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            # desired_playing_state=False,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=lambda: PoseProcessor(
                model_settings=model_settings,
                save_state=save_state,
                display_settings=display_settings,
                rep_count_settings=rep_count_settings,
                uploaded_pose_file=uploaded_pose_file,
                reload_pose=reload_pose,
            ),
        )

    main_col, sub_col = st.columns(2)

    # locals_to_update: List[str] = [
    #     "display_settings",
    #     "rep_count_settings",
    #     "pose_save_path",
    #     # "skeleton_save_path",
    #     "uploaded_pose_file",
    #     "reload_pose",
    #     # "reset_button",
    #     "video_save_path",
    # ]

    with main_col:
        key: str = "front"
        webrtc_ctx_main = gen_webrtc_ctx(key=key)
        st.session_state["started"] = webrtc_ctx_main.state.playing
        pose_save_path = str(pose_save_dir / f"{key}.pkl") if (pose_save_dir is not None) else None
        video_save_path = str(video_save_dir / f"{key}.mp4") if (video_save_dir is not None) else None

        # NOTE: 動的に監視したい変数以外は以下に含める必要なし?
        # NOTE: mainとsubをカメラ構造体or辞書にまとめる?
        if webrtc_ctx_main.video_processor:
            # _update_video_processor(webrtc_ctx_main.video_processor, locals(), target_var_names=locals_to_update)
            webrtc_ctx_main.video_processor.display_settings = display_settings
            webrtc_ctx_main.video_processor.rep_count_settings = rep_count_settings
            webrtc_ctx_main.video_processor.save_state = save_state
            webrtc_ctx_main.video_processor.pose_save_path = pose_save_path
            # TODO: スケルトンの動作確認とデバッグ
            # webrtc_ctx_main.video_processor.skeleton_save_path = str(Path("skeletons") / f"{now_str}_{cam_type}_cam.jpg")
            webrtc_ctx_main.video_processor.uploaded_pose_file = uploaded_pose_file
            webrtc_ctx_main.video_processor.reset_button = reset_button
            webrtc_ctx_main.video_processor.reload_pose = reload_pose
            webrtc_ctx_main.video_processor.video_save_path = video_save_path
            if st.button("BODY"):
                st.write(webrtc_ctx_main.video_processor.body_length)
                print(webrtc_ctx_main.video_processor.body_length)
    if use_two_cam:
        with sub_col:
            key: str = "side"
            webrtc_ctx_sub = gen_webrtc_ctx(key=key)
            pose_save_path = str(pose_save_dir / f"{key}.pkl") if (pose_save_dir is not None) else None
            video_save_path = str(video_save_dir / f"{key}.mp4") if (video_save_dir is not None) else None

            if webrtc_ctx_sub.video_processor:
                webrtc_ctx_sub.video_processor.display_settings = display_settings
                webrtc_ctx_sub.video_processor.rep_count_settings = rep_count_settings
                webrtc_ctx_sub.video_processor.save_state = save_state
                webrtc_ctx_sub.video_processor.pose_save_path = pose_save_path
                # # TODO: スケルトンの動作確認とデバッグ
                # webrtc_ctx_sub.video_processor.skeleton_save_path = str(
                #     Path("skeletons") / f"{now_str}_{cam_type}_cam.jpg"
                # )
                # TODO: カメラごとに異なる uploaded_pose を自動設定する
                webrtc_ctx_sub.video_processor.uploaded_pose_file = uploaded_pose_file
                webrtc_ctx_sub.video_processor.reload_pose = reload_pose
                webrtc_ctx_sub.video_processor.reset_button = reset_button
                webrtc_ctx_sub.video_processor.video_save_path = video_save_path


# def _update_video_processor(vp, _locals: Dict[str, Any], target_var_names: List[str]) -> None:
#     for key in target_var_names:
#         assert hasattr(vp, key)
#         vp.__dict__[key] = _locals[key]


if __name__ == "__main__":
    app()
