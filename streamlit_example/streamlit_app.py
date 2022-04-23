import copy
import json
import os
import pickle
import time
from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union, Callable

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
import streamlit as st
from streamlit_webrtc import ClientSettings, VideoProcessorBase, WebRtcMode, webrtc_streamer
from aiortc.contrib.media import MediaRecorder

from fake_objects import FakeLandmarkObject, FakeLandmarksObject, FakeResultObject
from main import draw_landmarks, draw_stick_figure
from utils import CvFpsCalc

_SENTINEL_ = "_SENTINEL_"


def pose_process(
    in_queue: Queue,
    out_queue: Queue,
    static_image_mode,
    model_complexity,
    min_detection_confidence,
    min_tracking_confidence,
):
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=static_image_mode,
        model_complexity=model_complexity,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )

    while True:
        try:
            input_item = in_queue.get(timeout=10)
        except Exception as e:
            print(e)
            continue

        if isinstance(input_item, type(_SENTINEL_)) and input_item == _SENTINEL_:
            break

        results = pose.process(input_item)
        if results.pose_landmarks.landmark is None:
            continue
        picklable_results = FakeResultObject(
            pose_landmarks=FakeLandmarksObject(
                landmark=[
                    FakeLandmarkObject(
                        x=pose_landmark.x,
                        y=pose_landmark.y,
                        z=pose_landmark.z,
                        visibility=pose_landmark.visibility,
                    )
                    for pose_landmark in results.pose_landmarks.landmark
                ]
            )
        )
        out_queue.put_nowait(picklable_results)


class PosefitVideoProcessor(VideoProcessorBase):
    def __init__(
        self,
        static_image_mode: bool,
        model_complexity,
        min_detection_confidence,
        min_tracking_confidence,
        rev_color: bool,
        rotate_webcam_input: bool,
        show_fps: bool,
        show_2d: bool,
        uploaded_pose,
        capture_skelton: bool,
        reset_button: bool,
        count_rep: bool,
        reload_pose: bool,
        pose_save_path: Union[str, None] = None,
        skelton_save_path: Union[str, None] = None,
    ) -> None:
        self._in_queue = Queue()
        self._out_queue = Queue()
        self._pose_process = Process(
            target=pose_process,
            kwargs={
                "in_queue": self._in_queue,
                "out_queue": self._out_queue,
                "static_image_mode": static_image_mode,
                "model_complexity": model_complexity,
                "min_detection_confidence": min_detection_confidence,
                "min_tracking_confidence": min_tracking_confidence,
            },
        )
        self._cvFpsCalc = CvFpsCalc(buffer_len=10)  # XXX: buffer_len は 10 が最適なのか？

        self.rev_color = rev_color
        self.rotate_webcam_input = rotate_webcam_input
        self.show_fps = show_fps
        self.show_2d = show_2d
        self.capture_skelton = capture_skelton
        self.count_rep = count_rep
        self.rep_count = 0
        self.frame_index = 0
        self.is_lifting_up = False
        self.body_length = 0
        self.initial_body_length = 0
        self.reload_pose = reload_pose

        self.pose_save_path: Union[str, None] = pose_save_path
        self.pose_mem: List[FakeLandmarksObject] = []  # HACK: List[FakeResultObject]では?

        self.skelton_save_path: Union[str, None] = skelton_save_path

        # お手本ポーズを3DでLoad
        self.uploaded_pose = uploaded_pose
        self.loaded_poses: List[FakeResultObject] = []
        self.uploaded_poses: List[FakeResultObject] = []
        if uploaded_pose is not None:
            self.loaded_poses = self._load_pose(uploaded_pose)
            self.uploaded_poses = self.loaded_poses.copy()

        self._pose_process.start()

    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_as_pickle(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _load_pose(self, uploaded_pose):
        with open(f"poses/{uploaded_pose.name}", "rb") as handle:
            loaded_poses = pickle.load(handle)
        return loaded_poses

    def _reset_training_set(self):
        if self.uploaded_pose is not None:
            self.loaded_poses = self._load_pose(self.uploaded_pose)
        self.frame_index = 0
        self.rep_count = 0
        self.is_lifting_up = False

    def _save_bone_info(self, results):
        print("save!!!")
        # TODO: この辺はurilsに連れて行く
        bone_edge_names = {
            "shoulder_width": (11, 12),
            "shin": (27, 25),
            "thigh": (25, 23),
            "full_leg": (27, 23),
            "pelvic_width": (23, 24),
            "flank": (23, 11),
            "upper_arm": (11, 13),
            "fore_arm": (13, 15),
            "full_arm": (11, 15),
        }

        bone_dict = {"foot_neck_height": self._calculate_height(results.pose_landmarks.landmark)}
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = self._calculate_3d_distance(
                results.pose_landmarks.landmark[bone_edge_names[bone_edge_key][0]],
                results.pose_landmarks.landmark[bone_edge_names[bone_edge_key][1]],
            )

        with open("data.json", "w") as fp:
            json.dump(bone_dict, fp)

    def _update_rep_count(self, results, upper_thre=0.9, lower_thre=0.6):
        if self.frame_index == 0:
            self.initial_body_length = results.pose_landmarks.landmark[29].y - results.pose_landmarks.landmark[11].y
        else:
            self.body_length = results.pose_landmarks.landmark[29].y - results.pose_landmarks.landmark[11].y
            if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_length:
                self.rep_count += 1
                self.is_lifting_up = False
            elif not self.is_lifting_up and self.body_length < lower_thre * self.initial_body_length:
                self.is_lifting_up = True

    def _calculate_3d_distance(self, joint1, joint2):
        self.joint1_pos = np.array([joint1.x, joint1.y, joint1.z])
        self.joint2_pos = np.array([joint2.x, joint2.y, joint2.z])
        return np.linalg.norm(self.joint2_pos - self.joint1_pos)

    def _calculate_height(self, pose_landmark):
        shoulder1 = pose_landmark[11]
        shoulder2 = pose_landmark[12]
        foot1 = pose_landmark[27]
        foot2 = pose_landmark[28]
        self.neck = np.array([shoulder1.x + shoulder2.x, shoulder1.y + shoulder2.y, shoulder1.z + shoulder2.z])
        self.foot_center = np.array([foot1.x + foot2.x, foot1.y + foot2.y, foot1.z + foot2.z])
        return np.linalg.norm(self.neck / 2 - self.foot_center / 2)

    # def _cast_landmark_nparr(self, pose_landmark):

    def _caluculate_slkelton():
        print("hello skelton")

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._cvFpsCalc.get()

        if self.reset_button:
            self._reset_training_set()
            self.reset_button = False

        # 色指定
        if self.rev_color:
            color = (255, 255, 255)
            bg_color = (100, 33, 3)
        else:
            color = (100, 33, 3)
            bg_color = (255, 255, 255)

        # カメラキャプチャ #####################################################
        image = frame.to_ndarray(format="bgr24")

        image = cv.flip(image, 1)  # ミラー表示
        if self.rotate_webcam_input:
            image = cv.rotate(image, cv.ROTATE_90_CLOCKWISE)
        debug_image01 = copy.deepcopy(image)
        debug_image02 = np.zeros((image.shape[0], image.shape[1], 3), np.uint8)
        cv.rectangle(
            debug_image02,
            (0, 0),
            (image.shape[1], image.shape[0]),
            bg_color,
            thickness=-1,
        )

        # 画像の保存
        if self.capture_skelton:
            print(self.skelton_save_path)
            cv.imwrite(self.skelton_save_path, image)

        # リロード
        if self.reload_pose:
            self.loaded_poses = self.uploaded_poses.copy()
            self.reload_pose = False

        # 検出実施 #############################################################
        image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
        if self.show_2d:
            results = self._infer_pose(image)

            # レップカウントを更新
            self._update_rep_count(results)

            # pose の保存
            if self.pose_save_path is not None:
                self.pose_mem.append(results)
            # results = self._pose.process(image)
            if self.capture_skelton:
                self._save_bone_info(results)
                self.capture_skelton = False

            # Poseの描画 ################################################################
            if results.pose_landmarks is not None:
                # 描画
                debug_image01 = draw_landmarks(
                    debug_image01,
                    results.pose_landmarks,
                )
                debug_image02 = draw_stick_figure(
                    debug_image02,
                    results.pose_landmarks,
                    color=color,
                    bg_color=bg_color,
                )

            # お手本Poseの描画
            if self.loaded_poses:
                loaded_pose = self.loaded_poses.pop(0)
                debug_image01 = draw_landmarks(
                    debug_image01,
                    loaded_pose.pose_landmarks,
                    is_loaded=True,
                )

        if self.show_fps:
            cv.putText(
                debug_image01,
                "FPS:" + str(display_fps),
                (10, 30),
                cv.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
                cv.LINE_AA,
            )
            cv.putText(
                debug_image02,
                "FPS:" + str(display_fps),
                (10, 30),
                cv.FONT_HERSHEY_SIMPLEX,
                1.0,
                color,
                2,
                cv.LINE_AA,
            )

        # show rep count
        if self.count_rep:
            cv.putText(
                debug_image01,
                f"Rep:{self.rep_count}",
                (10, 60),
                cv.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                1,
                cv.LINE_AA,
            )

        self.frame_index += 1
        return av.VideoFrame.from_ndarray(debug_image01, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
        if self.pose_save_path is not None:
            print(f"Saving {len(self.pose_mem)} pose frames to {self.pose_save_path}")
            os.makedirs(os.path.dirname(self.pose_save_path), exist_ok=True)
            self._save_as_pickle(self.pose_mem, self.pose_save_path)
        print("Stopped!")


def main():
    with st.expander("Model parameters (there parameters are effective only at initialization)"):
        static_image_mode = st.checkbox("Static image mode")
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

    with st.expander("Display settings"):
        rev_color = st.checkbox("Reverse color", value=False)
        rotate_webcam_input = st.checkbox("Rotate webcam input", value=False)
        show_fps = st.checkbox("Show FPS", value=True)
        show_2d = st.checkbox("Show 2D", value=True)
        count_rep: bool = st.checkbox("Count rep", value=True)

    with st.expander("Save settings"):
        save_video = st.checkbox("Save Video", value=False)
        save_pose = st.checkbox("Save Pose", value=False)

    use_two_cam: bool = st.checkbox("Use two cam", value=False)
    uploaded_pose = st.file_uploader("Load example pose file (.pkl)", type="pkl")

    capture_skelton = False

    if st.button("Save"):
        # 最後の試行で上のボタンがクリックされた
        st.write("Pose Saved")
        capture_skelton = True
    else:
        # クリックされなかった
        st.write("Not saved yet")
    reset_button = st.button("Reset")

    if st.button("RELOAD"):
        reload_pose = True
        st.write("RELOADED")
    else:
        reload_pose = False

    now_str: str = time.strftime("%Y-%m-%d-%H-%M-%S")

    def processor_factory():
        return PosefitVideoProcessor(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            rev_color=rev_color,
            rotate_webcam_input=rotate_webcam_input,
            show_fps=show_fps,
            show_2d=show_2d,
            uploaded_pose=uploaded_pose,
            capture_skelton=capture_skelton,
            reset_button=reset_button,
            count_rep=count_rep,
            reload_pose=reload_pose,
        )

    def gen_in_recorder_factory(video_save_path: str) -> Callable[[], MediaRecorder]:
        # assert Path(video_save_path).parent.exists() and Path(video_save_path).parent.is_dir()
        return lambda: MediaRecorder(video_save_path, format="mp4")

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=processor_factory,
            in_recorder_factory=gen_in_recorder_factory(str(Path("videos") / f"{now_str}_{key}.mp4"))
            if save_video
            else None,
        )

    webrtc_ctx_main = gen_webrtc_ctx(key="main_cam")
    st.session_state["started"] = webrtc_ctx_main.state.playing

    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.rev_color = rev_color
        webrtc_ctx_main.video_processor.rotate_webcam_input = rotate_webcam_input
        webrtc_ctx_main.video_processor.show_fps = show_fps
        webrtc_ctx_main.video_processor.show_2d = show_2d
        webrtc_ctx_main.video_processor.pose_save_path = (
            str(Path("poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
        )
        webrtc_ctx_main.video_processor.skelton_save_path = str(Path("skeltons") / f"{now_str}_{cam_type}_cam.jpg")
        webrtc_ctx_main.video_processor.uploaded_pose = uploaded_pose
        webrtc_ctx_main.video_processor.capture_skelton = capture_skelton
        webrtc_ctx_main.video_processor.reset_button = reset_button
        webrtc_ctx_main.video_processor.count_rep = count_rep
        webrtc_ctx_main.video_processor.reload_pose = reload_pose

    if use_two_cam:
        webrtc_ctx_sub = gen_webrtc_ctx(key="sub_cam")

        if webrtc_ctx_sub.video_processor:
            cam_type: str = "sub"
            webrtc_ctx_sub.video_processor.rev_color = rev_color
            # TODO: rotate をカメラごとに設定可能にする
            webrtc_ctx_sub.video_processor.rotate_webcam_input = rotate_webcam_input
            webrtc_ctx_sub.video_processor.show_fps = show_fps
            webrtc_ctx_sub.video_processor.show_2d = show_2d
            webrtc_ctx_sub.video_processor.pose_save_path = (
                str(Path("poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
            )
            webrtc_ctx_sub.video_processor.skelton_save_path = str(Path("skeltons") / f"{now_str}_{cam_type}_cam.jpg")
            # TODO: カメラごとに異なる uploaded_pose を自動設定する
            webrtc_ctx_sub.video_processor.uploaded_pose = uploaded_pose
            webrtc_ctx_sub.video_processor.capture_skelton = capture_skelton
            webrtc_ctx_main.video_processor.count_rep = count_rep
            webrtc_ctx_sub.video_processor.reload_pose = reload_pose


if __name__ == "__main__":
    main()
