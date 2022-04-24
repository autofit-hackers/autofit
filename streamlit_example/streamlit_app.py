import copy
import json
import os
import pickle
import time
from datetime import datetime
from multiprocessing import Process, Queue
from pathlib import Path
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
        try:
            input_item = in_queue.get(timeout=10)
        except Exception as e:
            print(e)
            continue

        if isinstance(input_item, type(_SENTINEL_)) and input_item == _SENTINEL_:
            break

        results = pose.process(input_item)
        # NOTE: 検出失敗時の例外処理をシンプルにできないか
        # NOTE: resultsっていう変数名分かりにくくね?
        if results.pose_landmarks is None:
            out_queue.put_nowait(None)
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
    # NOTE: メンバ変数多すぎ。減らすorまとめたい
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
        upper_threshold,
        lower_threshold,
        video_save_path: Union[str, None] = None,
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
        self.upper_threshold = upper_threshold
        self.lower_threshold = lower_threshold
        self.frame_index = 0
        self.is_lifting_up = False
        self.body_length = 0
        self.initial_body_length = 0
        self.reload_pose = reload_pose

        self.video_save_path = video_save_path
        self.video_writer: Union[cv.VideoWriter, None] = None

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

    # NOTE: infer or estimate で用語統一する?
    def _infer_pose(self, image):
        self._in_queue.put_nowait(image)
        return self._out_queue.get(timeout=10)

    def _save_estimated_pose(self, obj, save_path) -> None:
        with open(save_path, "wb") as handle:
            pickle.dump(obj, handle, protocol=pickle.HIGHEST_PROTOCOL)

    def _load_pose(self, uploaded_pose):
        with open(f"poses/{uploaded_pose.name}", "rb") as handle:
            loaded_poses = pickle.load(handle)
        return loaded_poses

    def _show_loaded_pose(self, frame, results):
        loaded_pose = self.loaded_poses.pop(0)
        foot1 = results.pose_landmarks.landmark[27]
        foot2 = results.pose_landmarks.landmark[28]
        foot_center = np.array([foot1.x + foot2.x, foot1.y + foot2.y, foot1.z + foot2.z])
        foot1_load = loaded_pose.pose_landmarks.landmark[27]
        foot2_load = loaded_pose.pose_landmarks.landmark[28]
        foot_center_load = np.array(
            [foot1_load.x + foot2_load.x, foot1_load.y + foot2_load.y, foot1_load.z + foot2_load.z]
        )
        estimated_height = self._calculate_height(results.pose_landmarks.landmark)
        loaded_height = self._calculate_height(loaded_pose.pose_landmarks.landmark)
        height_ratio = estimated_height / loaded_height

        frame = draw_landmarks(
            frame,
            loaded_pose.pose_landmarks,
            is_loaded=True,
        )
        return frame

    def _reset_training_set(self):
        if self.uploaded_pose is not None:
            self.loaded_poses = self._load_pose(self.uploaded_pose)
        self.frame_index = 0
        self.rep_count = 0
        self.is_lifting_up = False

    def _save_bone_info(self, results):
        print("save!!!")
        # TODO: この辺はutilsに連れて行く
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

    def _update_rep_count(self, results, upper_thre, lower_thre):
        if self.frame_index == 0:
            self.initial_body_length = results.pose_landmarks.landmark[29].y - results.pose_landmarks.landmark[11].y
        else:
            self.body_length = results.pose_landmarks.landmark[29].y - results.pose_landmarks.landmark[11].y
            if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_length:
                self.rep_count += 1
                self.is_lifting_up = False
            elif not self.is_lifting_up and self.body_length < lower_thre * self.initial_body_length:
                self.is_lifting_up = True

    def _is_key_frame(self, results, upper_thre=0.96, lower_thre=0.94):
        if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_length:
            print("return true if is key frame")

    def _calculate_3d_distance(self, joint1, joint2):
        self.joint1_pos = np.array([joint1.x, joint1.y, joint1.z])
        self.joint2_pos = np.array([joint2.x, joint2.y, joint2.z])
        return np.linalg.norm(self.joint2_pos - self.joint1_pos)

    # NOTE: ResultObject or ndarrayで計算
    def _calculate_height(self, landmark):
        shoulder1 = landmark[11]
        shoulder2 = landmark[12]
        foot1 = landmark[27]
        foot2 = landmark[28]
        self.neck = np.array([shoulder1.x + shoulder2.x, shoulder1.y + shoulder2.y, shoulder1.z + shoulder2.z])
        self.foot_center = np.array([foot1.x + foot2.x, foot1.y + foot2.y, foot1.z + foot2.z])
        return np.linalg.norm(self.neck / 2 - self.foot_center / 2)

    # def _cast_landmark_nparr(self, pose_landmark):

    def _caluculate_slkelton():
        print("hello skelton")

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def _results_to_ndarray(self, results):
        frame_keypoints = []
        if results.pose_landmarks:
            for i, landmark in enumerate(results.pose_landmarks.landmark):
                keypoint = [landmark.x, landmark.y, landmark.z, landmark.visibility]
                frame_keypoints.append(keypoint)
        else:
            # if no keypoints are found, simply fill the frame data with [-1,-1] for each kpt
            frame_keypoints = [[-1, -1]] * len(results.pose_landmarks.landmark)
        return np.array(frame_keypoints)

    def _ndarray_to_results(self, frame_keypoints):
        results = FakeResultObject(
            pose_landmarks=FakeLandmarksObject(
                landmark=[
                    FakeLandmarkObject(
                        x=keypoint[0],
                        y=keypoint[1],
                        z=keypoint[2],
                        visibility=keypoint[3],
                    )
                    for keypoint in frame_keypoints
                ]
            )
        )
        return results

    def recv(self, raw_frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._cvFpsCalc.get()

        if self.reset_button:
            self._reset_training_set()
            self.reset_button = False

        if (self.video_save_path is not None) and (self.video_writer is None):
            # video_writer の初期化
            # TODO: fps は 30 で決め打ちしているが、実際には処理環境に応じて変化する
            self.video_writer = create_video_writer(save_path=self.video_save_path, fps=30, frame=raw_frame)

        # 色指定
        # NOTE: 必要?
        if self.rev_color:
            color = (255, 255, 255)
            bg_color = (100, 33, 3)
        else:
            color = (100, 33, 3)
            bg_color = (255, 255, 255)

        raw_frame = raw_frame.to_ndarray(format="bgr24")
        raw_frame = cv.flip(raw_frame, 1)  # ミラー表示
        if self.rotate_webcam_input:
            raw_frame = cv.rotate(raw_frame, cv.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(raw_frame)

        # 動画の保存
        if self.video_save_path is not None:
            assert self.video_writer is not None
            self.video_writer.write(raw_frame)

        # 画像の保存
        if self.capture_skelton:
            print(self.skelton_save_path)
            cv.imwrite(self.skelton_save_path, raw_frame)

        # リロード
        if self.reload_pose:
            self.loaded_poses = self.uploaded_poses.copy()
            self.reload_pose = False

        # 検出実施 #############################################################
        raw_frame = cv.cvtColor(raw_frame, cv.COLOR_BGR2RGB)
        results = self._infer_pose(raw_frame)
        if self.show_2d and results:
            # results = self._infer_pose(image)

            # レップカウントを更新
            self._update_rep_count(results, upper_thre=self.upper_threshold, lower_thre=self.lower_threshold)

            # pose の保存
            if self.pose_save_path is not None:
                self.pose_mem.append(results)
            # results = self._pose.process(image)
            if self.capture_skelton:
                # print(self.skelton_save_path, datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))
                self._save_bone_info(results)
                # print(self.skelton_save_path, datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))
                self.capture_skelton = False

            # Poseの描画 ################################################################
            if results.pose_landmarks is not None:
                # 描画
                processed_frame = draw_landmarks(
                    processed_frame,
                    results.pose_landmarks,
                )

            # お手本Poseの描画
            if self.loaded_poses:
                processed_frame = self._show_loaded_pose(processed_frame, results)

        if self.show_fps:
            cv.putText(
                processed_frame,
                "FPS:" + str(display_fps),
                (10, 30),
                cv.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 255, 0),
                2,
                cv.LINE_AA,
            )

        # show rep count
        if self.count_rep:
            cv.putText(
                processed_frame,
                f"Rep:{self.rep_count}",
                (10, 60),
                cv.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                1,
                cv.LINE_AA,
            )

        self.frame_index += 1
        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        self._stop_pose_process()
        if self.video_writer is not None:
            print("Stop writing video process...")
            self.video_writer.release()
        if self.pose_save_path is not None:
            print(f"Saving {len(self.pose_mem)} pose frames to {self.pose_save_path}")
            os.makedirs(os.path.dirname(self.pose_save_path), exist_ok=True)
            self._save_estimated_pose(self.pose_mem, self.pose_save_path)
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

    with st.expander("rep counter settings"):
        count_rep: bool = st.checkbox("Count rep", value=True)
        upper_threshold = st.slider("upper_threshold", min_value=0.0, max_value=1.0, value=0.9, step=0.01)
        lower_threshold = st.slider("lower_threshold", min_value=0.0, max_value=1.0, value=0.8, step=0.01)

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
            upper_threshold=upper_threshold,
            lower_threshold=lower_threshold,
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

    webrtc_ctx_main = gen_webrtc_ctx(key="posefit_main_cam")
    print("a")
    st.session_state["started"] = webrtc_ctx_main.state.playing

    # NOTE: 動的に監視したい変数以外は以下に含める必要なし?
    # NOTE: mainとsubをカメラ構造体or辞書にまとめる?
    if webrtc_ctx_main.video_processor:
        cam_type: str = "main"
        webrtc_ctx_main.video_processor.rev_color = rev_color
        webrtc_ctx_main.video_processor.rotate_webcam_input = rotate_webcam_input
        webrtc_ctx_main.video_processor.show_fps = show_fps
        webrtc_ctx_main.video_processor.show_2d = show_2d
        webrtc_ctx_main.video_processor.video_save_path = (
            str(Path("videos") / f"{now_str}_{cam_type}_cam.mp4") if save_video else None
        )
        webrtc_ctx_main.video_processor.pose_save_path = (
            str(Path("poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
        )
        webrtc_ctx_main.video_processor.skelton_save_path = str(Path("skeltons") / f"{now_str}_{cam_type}_cam.jpg")
        webrtc_ctx_main.video_processor.uploaded_pose = uploaded_pose
        webrtc_ctx_main.video_processor.capture_skelton = capture_skelton
        webrtc_ctx_main.video_processor.reset_button = reset_button
        webrtc_ctx_main.video_processor.count_rep = count_rep
        webrtc_ctx_main.video_processor.reload_pose = reload_pose
        webrtc_ctx_main.video_processor.upper_threshold = upper_threshold
        webrtc_ctx_main.video_processor.lower_threshold = lower_threshold

    if use_two_cam:
        webrtc_ctx_sub = gen_webrtc_ctx(key="posefit_sub_cam")

        if webrtc_ctx_sub.video_processor:
            cam_type: str = "sub"
            webrtc_ctx_sub.video_processor.rev_color = rev_color
            # TODO: rotate をカメラごとに設定可能にする
            webrtc_ctx_sub.video_processor.rotate_webcam_input = rotate_webcam_input
            webrtc_ctx_sub.video_processor.show_fps = show_fps
            webrtc_ctx_sub.video_processor.show_2d = show_2d
            webrtc_ctx_sub.video_processor.video_save_path = (
                str(Path("videos") / f"{now_str}_{cam_type}_cam.mp4") if save_video else None
            )
            webrtc_ctx_sub.video_processor.pose_save_path = (
                str(Path("poses") / f"{now_str}_{cam_type}_cam.pkl") if save_pose else None
            )
            webrtc_ctx_sub.video_processor.skelton_save_path = str(Path("skeltons") / f"{now_str}_{cam_type}_cam.jpg")
            # TODO: カメラごとに異なる uploaded_pose を自動設定する
            webrtc_ctx_sub.video_processor.uploaded_pose = uploaded_pose
            webrtc_ctx_sub.video_processor.capture_skelton = capture_skelton
            webrtc_ctx_sub.video_processor.count_rep = count_rep
            webrtc_ctx_sub.video_processor.reload_pose = reload_pose
            webrtc_ctx_sub.video_processor.reset_button = reset_button
            webrtc_ctx_sub.video_processor.upper_threshold = upper_threshold
            webrtc_ctx_sub.video_processor.lower_threshold = lower_threshold


if __name__ == "__main__":
    main()
