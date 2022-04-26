import copy
import json
import os
import pickle
from multiprocessing import Process, Queue
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
from streamlit_webrtc import VideoProcessorBase
from utils import (
    FpsCalculator,
    draw_landmarks,
    PoseLandmarksObject,
)

_SENTINEL_ = "_SENTINEL_"


def pose_process(
    in_queue: Queue,
    out_queue: Queue,
    static_image_mode,
    model_complexity: int,
    min_detection_confidence: float,
    min_tracking_confidence: float,
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

        picklable_results = PoseLandmarksObject(
            landmark=np.array(
                [
                    [pose_landmark.x, pose_landmark.y, pose_landmark.z]
                    for pose_landmark in results.pose_landmarks.landmark
                ]
            ),
            visibility=np.array([pose_landmark.visibility for pose_landmark in results.pose_landmarks.landmark]),
        )

        out_queue.put_nowait(picklable_results)


class PoseProcessor(VideoProcessorBase):
    # NOTE: 変数多すぎ。減らすorまとめたい
    def __init__(
        self,
        static_image_mode: bool,
        model_complexity: int,
        min_detection_confidence: float,
        min_tracking_confidence: float,
        rev_color: bool,
        rotate_webcam_input: bool,
        show_fps: bool,
        show_2d: bool,
        uploaded_pose,
        capture_skelton: bool,
        reset_button: bool,
        count_rep: bool,
        reload_pose: bool,
        upper_threshold: float,
        lower_threshold: float,
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
        self._FpsCalculator = FpsCalculator(buffer_len=10)  # XXX: buffer_len は 10 が最適なのか？

        # NOTE: 変数をまとめたいよう（realtime_settings, realtime_states, uploaded_settimgs, training_menu_settings）
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

        self.video_writer: Union[cv.VideoWriter, None] = None

        self.pose_save_path: Union[str, None] = pose_save_path
        self.pose_mem: List[PoseLandmarksObject] = []

        self.skelton_save_path: Union[str, None] = skelton_save_path

        # お手本ポーズを3DでLoad
        self.uploaded_pose = uploaded_pose
        self.loaded_poses: List[PoseLandmarksObject] = []
        self.uploaded_poses: List[PoseLandmarksObject] = []
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

    def _save_pose(self):
        if self.pose_save_path is not None:
            print(f"Saving {len(self.pose_mem)} pose frames to {self.pose_save_path}")
            os.makedirs(os.path.dirname(self.pose_save_path), exist_ok=True)
            self._save_estimated_pose(self.pose_mem, self.pose_save_path)

    def _load_pose(self, uploaded_pose):
        with open(f"poses/{uploaded_pose.name}", "rb") as handle:
            loaded_poses = pickle.load(handle)
        return loaded_poses

    def _show_loaded_pose(self, frame):
        self.loaded_one_shot_pose = self.loaded_poses.pop(0)
        frame = draw_landmarks(
            frame,
            self.loaded_one_shot_pose,
            is_loaded=True,
        )
        return frame

    # TODO: adjust webcam input aspect when rotate
    def _reset_training_set(self, results: PoseLandmarksObject):
        is_adjust_on = True
        if self.uploaded_poses and is_adjust_on:
            # loaded posesの重ね合わせ
            realtime_single_pose_array = self._results_to_ndarray(results)
            loaded_poses_array = []
            for i, uploaded_pose in enumerate(self.uploaded_poses):
                loaded_poses_array.append(self._results_to_ndarray(uploaded_pose))
            adjusted_poses_array = self._adjust_poses(realtime_single_pose_array, loaded_poses_array)
            self.loaded_poses = []
            for i, adjusted_pose_arr in enumerate(adjusted_poses_array):
                self.loaded_poses.append(self._ndarray_to_results(adjusted_pose_arr))
        elif self.uploaded_poses:
            self.loaded_poses = self.uploaded_poses.copy()

        self.frame_index = 0
        self.rep_count = 0
        self.is_lifting_up = False

    def _adjust_poses(self, realtime_pose: PoseLandmarksObject, loaded_poses: PoseLandmarksObject):
        # TODO: foot pos を計算する関数を作成
        # TODO: [Fakes]かndarrayでheightの計算も統一
        realtime_height = self._calculate_height_np(realtime_pose)
        loaded_height = self._calculate_height_np(loaded_poses[0])
        scale = realtime_height / loaded_height  # スケーリング用の定数

        realtime_foot_pos = self._calculate_foot_pos_np(realtime_pose)
        loaded_foot_pos = self._calculate_foot_pos_np(loaded_poses[0]) * scale

        slide = np.array(
            [(realtime_foot_pos - loaded_foot_pos)[0], (realtime_foot_pos - loaded_foot_pos)[1], 0, 0]
        )  # 位置合わせ用の[x,y,0,0]のベクター
        print(scale, slide)

        adjusted_poses = []
        for i, loaded_pose in enumerate(loaded_poses):
            adjusted_pose = []
            for j, joint in enumerate(loaded_pose):
                adjusted_pose.append(joint * scale + slide)
            adjusted_poses.append(adjusted_pose)

        return adjusted_poses

    def _save_bone_info(self, results: PoseLandmarksObject):
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

        bone_dict = {"foot_neck_height": self._calculate_height(results.landmark)}
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = self._calculate_3d_distance(
                results.landmark[bone_edge_names[bone_edge_key][0]],
                results.landmark[bone_edge_names[bone_edge_key][1]],
            )

        with open("data.json", "w") as fp:
            # TODO: data.json のパスをインスタンス変数化
            json.dump(bone_dict, fp)

    def _update_rep_count(self, results: PoseLandmarksObject, upper_thre: float, lower_thre: float):
        if self.frame_index == 0:
            self.initial_body_length = results.landmark[29][1] - results.landmark[11][1]
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

    def _calculate_height_np(self, pose_array):
        neck = (pose_array[11] + pose_array[12]) / 2
        foot_center = (pose_array[27] + pose_array[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def _calculate_foot_pos_np(self, pose_array):
        return (pose_array[27] + pose_array[28]) / 2

    def _realtime_coaching(self, results):
        result_array = self._results_to_ndarray(results)
        realtime_pose_array = self._results_to_ndarray(self.loaded_one_shot_pose)

        reccomend = []
        if np.linalg.norm(realtime_pose_array[27] - realtime_pose_array[28]) < np.linalg.norm(
            result_array[27] - result_array[28]
        ):
            reccomend.append("もう少し足幅を広げましょう")
        if np.linalg.norm(realtime_pose_array[15] - realtime_pose_array[16]) < np.linalg.norm(
            result_array[15] - result_array[16]
        ):
            reccomend.append("手幅を広げましょう")
        return reccomend

    # def _cast_landmark_nparr(self, pose_landmark):

    def _caluculate_slkelton():
        print("hello skelton")

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def _results_to_ndarray(self, results):
        poses_array = []
        if results.pose_landmarks:
            for i, landmark in enumerate(results.pose_landmarks.landmark):
                pose_array = [landmark.x, landmark.y, landmark.z, landmark.visibility]
                poses_array.append(pose_array)
        else:
            # if no keypoints are found, simply fill the frame data with [-1,-1] for each kpt
            poses_array = [[-1.0, -1.0]] * len(results.pose_landmarks.landmark)
        return np.array(poses_array)

    def _ndarray_to_results(self, poses_array):
        results = FakeResultObject(
            pose_landmarks=FakeLandmarksObject(
                landmark=[
                    FakeLandmarkObject(
                        x=pose_array[0],
                        y=pose_array[1],
                        z=pose_array[2],
                        visibility=pose_array[3],
                    )
                    for pose_array in poses_array
                ]
            )
        )
        return results

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._FpsCalculator.get()

        # 色指定
        # NOTE: 必要?
        if self.rev_color:
            color = (255, 255, 255)
            bg_color = (100, 33, 3)
        else:
            color = (100, 33, 3)
            bg_color = (255, 255, 255)

        # カメラキャプチャ #####################################################
        frame = frame.to_ndarray(format="bgr24")

        frame = cv.flip(frame, 1)  # ミラー表示
        # TODO: ここで image に対して single camera calibration
        if self.rotate_webcam_input:
            frame = cv.rotate(frame, cv.ROTATE_90_CLOCKWISE)
        processed_frame = copy.deepcopy(frame)

        # 画像の保存
        # TODO: capture skelton の rename or jsonの保存までするように関数書き換え
        if self.capture_skelton and self.skelton_save_path:
            print(self.skelton_save_path)
            cv.imwrite(self.skelton_save_path, frame)
            self.capture_skelton = False

        # リロード
        if self.reload_pose:
            self.loaded_poses = self.uploaded_poses.copy()
            self.reload_pose = False

        # 検出実施 #############################################################
        frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        results = self._infer_pose(frame)
        print(results)
        if self.show_2d and results:

            # reset params and adjust scale and position
            if self.reset_button:
                self._reset_training_set(results)
                self.reset_button = False

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
                # お手本poseは先に変換しておいてここでは呼ぶだけとする
                processed_frame = self._show_loaded_pose(processed_frame)

            # NOTE: ここに指導がくるので、ndarrayで持ちたい
            # NOTE: または infer_pose -> results to ndarray -> 重ね合わせパラメータ取得・指導の計算 -> ndarray to results -> 描画
            if True:
                print(self._realtime_coaching(results))

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
        self._save_pose()
        print("Stopped!")
