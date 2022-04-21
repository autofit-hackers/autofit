import copy
import json
import os
import pickle
import time
from multiprocessing import Process, Queue
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
import streamlit as st
from streamlit_webrtc import ClientSettings, VideoProcessorBase, WebRtcMode, webrtc_streamer

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
        input_item = in_queue.get(timeout=10)
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


def create_video_writer(save_path: str, fps: int, frame: av.VideoFrame) -> cv.VideoWriter:
    """Save video as mp4."""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    fourcc = cv.VideoWriter_fourcc("m", "p", "4", "v")
    video = cv.VideoWriter(save_path, fourcc, fps, (frame.width, frame.height))
    return video


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
        video_save_path: Union[str, None],
        pose_save_path: Union[str, None],
        uploaded_pose: Union[str, None],
        capture_skelton: bool,
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

        self.video_save_path = video_save_path
        self.video_writer: Union[cv.VideoWriter, None] = None

        self.pose_save_path: Union[str, None] = pose_save_path
        self.pose_mem: List[FakeLandmarksObject] = []  # HACK: List[FakeResultObject]では?

        # お手本ポーズを3DでLoad
        self.loaded_poses: List[FakeResultObject] = []
        if uploaded_pose is not None:
            self.loaded_poses = self._load_pose(uploaded_pose)

        self._pose_process.start()

    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_as_pickle(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _load_pose(self, uploaded_file):
        with open(f"poses/{uploaded_file.name}", "rb") as handle:
            loaded_poses = pickle.load(handle)
        return loaded_poses

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
                "full_arm": (11, 15)
        }
        
        bone_dict = {
            "foot_neck_height": self._calculate_height(results.pose_landmarks.landmark)
        }
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = self._calculate_3d_distance(results.pose_landmarks.landmark[bone_edge_names[bone_edge_key][0]], results.pose_landmarks.landmark[bone_edge_names[bone_edge_key][1]])

        with open("data.json", "w") as fp:
            json.dump(bone_dict, fp)
    
    def _calculate_3d_distance(self, joint1, joint2):
        self.joint1_pos = np.array([joint1.x, joint1.y, joint1.z])
        self.joint2_pos = np.array([joint2.x, joint2.y, joint2.z])
        return np.linalg.norm(self.joint2_pos-self.joint1_pos)
    
    def _calculate_height(self, pose_landmark):
        shoulder1 = pose_landmark[11]
        shoulder2 = pose_landmark[12]
        foot1 = pose_landmark[27]
        foot2 = pose_landmark[28]
        self.neck = np.array([shoulder1.x+shoulder2.x,shoulder1.y+shoulder2.y,shoulder1.z+shoulder2.z])
        self.foot_center = np.array([foot1.x+foot2.x,foot1.y+foot2.y,foot1.z+foot2.z])
        return np.linalg.norm(self.neck/2-self.foot_center/2)
    
    # def _cast_landmark_nparr(self, pose_landmark):
        

    def _caluculate_slkelton():
        print("hello skelton")

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._cvFpsCalc.get()

        if (self.video_save_path is not None) and (self.video_writer is None):
            # video_writer の初期化
            # TODO: fps は 30 で決め打ちしているが、実際には処理環境に応じて変化する
            self.video_writer = create_video_writer(save_path=self.video_save_path, fps=30, frame=frame)

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

        # 動画の保存
        if self.video_save_path is not None:
            assert self.video_writer is not None
            # NOTE: video_writer は cv2 の実装を用いているため、BGRの色順で良い
            self.video_writer.write(image)

        # 検出実施 #############################################################
        image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
        if self.show_2d:
            results = self._infer_pose(image)

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

        return av.VideoFrame.from_ndarray(debug_image01, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
        if self.video_writer is not None:
            print("Stop writing video process...")
            self.video_writer.release()
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

    video_save_path: Union[str, None] = (
        os.path.join("videos", time.strftime("%Y-%m-%d-%H-%M-%S.mp4")) if save_video else None
    )
    pose_save_path: Union[str, None] = (
        os.path.join("poses", time.strftime("%Y-%m-%d-%H-%M-%S.pkl")) if save_pose else None
    )

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
            video_save_path=video_save_path,
            pose_save_path=pose_save_path,
            uploaded_pose=uploaded_pose,
            capture_skelton=capture_skelton,
        )

    def gen_webrtc_ctx(key: str):
        return webrtc_streamer(
            key=key,
            mode=WebRtcMode.SENDRECV,
            client_settings=ClientSettings(
                rtc_configuration={"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]},
                media_stream_constraints={"video": True, "audio": False},
            ),
            video_processor_factory=processor_factory,
        )

    webrtc_ctx_main = gen_webrtc_ctx(key="posefit_main")
    st.session_state["started"] = webrtc_ctx_main.state.playing

    if webrtc_ctx_main.video_processor:
        webrtc_ctx_main.video_processor.rev_color = rev_color
        webrtc_ctx_main.video_processor.rotate_webcam_input = rotate_webcam_input
        webrtc_ctx_main.video_processor.show_fps = show_fps
        webrtc_ctx_main.video_processor.show_2d = show_2d
        webrtc_ctx_main.video_processor.video_save_path = video_save_path
        webrtc_ctx_main.video_processor.pose_save_path = pose_save_path
        webrtc_ctx_main.video_processor.uploaded_file = uploaded_pose
        webrtc_ctx_main.video_processor.capture_skelton = capture_skelton

    if use_two_cam:
        webrtc_ctx_sub = gen_webrtc_ctx(key="posefit_sub")

        if webrtc_ctx_sub.video_processor:
            webrtc_ctx_sub.video_processor.rev_color = rev_color
            # TODO: rotate をカメラごとに設定可能にする
            webrtc_ctx_sub.video_processor.rotate_webcam_input = rotate_webcam_input
            webrtc_ctx_sub.video_processor.show_fps = show_fps
            webrtc_ctx_sub.video_processor.show_2d = show_2d
            # TODO: カメラごとに異なる video_save_path を自動設定する
            webrtc_ctx_sub.video_processor.video_save_path = video_save_path
            # TODO: カメラごとに異なる pose_save_path を自動設定する
            webrtc_ctx_sub.video_processor.pose_save_path = pose_save_path
            # TODO: カメラごとに異なる uploaded_file を自動設定する
            webrtc_ctx_sub.video_processor.uploaded_file = uploaded_pose
            webrtc_ctx_sub.video_processor.capture_skelton = capture_skelton


if __name__ == "__main__":
    main()
