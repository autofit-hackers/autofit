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
from utils import FpsCalculator, draw_landmarks_pose, PoseLandmarksObject, mp_res_to_pose_obj

_SENTINEL_ = "_SENTINEL_"


def pose_process(
    in_queue: Queue,
    out_queue: Queue,
    static_image_mode,
    model_complexity: int,
    min_detection_confidence: float,
    min_tracking_confidence: float,
) -> None:
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

        out_queue.put_nowait(mp_res_to_pose_obj(results))


class PoseProcessor(VideoProcessorBase):
    # NOTE: 変数多すぎ。減らすorまとめたい
    def __init__(
        self,
        static_image_mode: bool,
        model_complexity: int,
        min_detection_confidence: float,
        min_tracking_confidence: float,
        rotate_webcam_input: bool,
        show_fps: bool,
        show_2d: bool,
        uploaded_pose_file,
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
        self.uploaded_pose = uploaded_pose_file
        self.loaded_frames: List[PoseLandmarksObject] = []
        self.uploaded_frames: List[PoseLandmarksObject] = []
        if uploaded_pose_file is not None:
            self.uploaded_frames = self._load_pose(uploaded_pose_file)
            self.loaded_frames = self.uploaded_frames.copy()  # 消す

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

    def _load_pose(self, uploaded_pose_file):
        with open(f"recorded_poses/{uploaded_pose_file.name}", "rb") as handle:
            loaded_frames = pickle.load(handle)
        return loaded_frames

    def _show_loaded_pose(self, frame):
        self.loaded_one_shot_pose = self.loaded_frames.pop(0)
        frame = draw_landmarks_pose(
            frame,
            self.loaded_one_shot_pose,
            is_loaded=True,
        )
        return frame

    # TODO: adjust webcam input aspect when rotate
    def _reset_training_set(self, realtime_array: PoseLandmarksObject):
        if self.uploaded_frames:
            self.positioned_frames = self._adjust_poses(realtime_array, self.uploaded_frames)
            print(len(self.positioned_frames))
            self.loaded_frames = self.positioned_frames.copy()
        self.frame_index = 0
        self.rep_count = 0
        self.is_lifting_up = False

    def _adjust_poses(
        self, realtime_pose: PoseLandmarksObject, loaded_frames: List[PoseLandmarksObject], start_frame_idx: int = 0
    ) -> List[PoseLandmarksObject]:
        """拡大縮小・平行移動により、ロードしたお手本フォームを現在のトレーニーのフォームに重ね合わせる

        Args:
            realtime_pose (PoseLandmarksObject): トレーニーのリアルタイムのポーズ1フレーム
            loaded_frames (List[PoseLandmarksObject]): ロードしたお手本フォーム
            start_frame_idx (int, optional): お手本フォームのキーフレーム. Defaults to 0.

        Returns:
            List[PoseLandmarksObject]: 重ね合わせ後のお手本フォーム
        """
        realtime_height = self._calculate_height(realtime_pose)
        loaded_height = self._calculate_height(loaded_frames[start_frame_idx])
        scale = realtime_height / loaded_height  # スケーリング用の定数

        realtime_foot_position = self._calculate_foot_position(realtime_pose)
        loaded_foot_position = self._calculate_foot_position(loaded_frames[start_frame_idx]) * scale

        # 位置合わせ用の[x,y,0]のベクター
        slide: np.ndarray = realtime_foot_position - loaded_foot_position
        slide[2] = 0
        print(scale, slide)

        adjusted_poses = [
            PoseLandmarksObject(landmark=frame.landmark * scale + slide, visibility=frame.visibility)
            for frame in loaded_frames
        ]

        return adjusted_poses

    def _save_bone_info(self, captured_skelton: PoseLandmarksObject):
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

        bone_dict = {"foot_neck_height": self._calculate_height(captured_skelton)}
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = np.linalg.norm(
                captured_skelton.landmark[bone_edge_names[bone_edge_key][0]]
                - captured_skelton.landmark[bone_edge_names[bone_edge_key][1]]
            )

        with open("data.json", "w") as fp:
            # TODO: data.json のパスをインスタンス変数化
            json.dump(bone_dict, fp)

    def _update_rep_count(self, results: PoseLandmarksObject, upper_thre: float, lower_thre: float) -> None:
        if self.frame_index == 0:
            self.initial_body_length = results.landmark[29][1] - results.landmark[11][1]
        else:
            self.body_length = results.landmark[29][1] - results.landmark[11][1]
            if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_length:
                self.rep_count += 1
                self.is_lifting_up = False
            elif not self.is_lifting_up and self.body_length < lower_thre * self.initial_body_length:
                self.is_lifting_up = True

    def _is_key_frame(self, realtime_array, upper_thre=0.96, lower_thre=0.94):
        if self.is_lifting_up and self.body_length > upper_thre * self.initial_body_length:
            print("return true if is key frame")
            self._reset_training_set(realtime_array)
            return False

    def _calculate_height(self, pose: PoseLandmarksObject):
        neck = (pose.landmark[11] + pose.landmark[12]) / 2
        foot_center = (pose.landmark[27] + pose.landmark[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def _calculate_foot_position(self, pose: PoseLandmarksObject):
        return (pose.landmark[27] + pose.landmark[28]) / 2

    def _realtime_coaching(self, result_array: PoseLandmarksObject):
        realtime_pose_array = self.loaded_one_shot_pose

        recommend = []
        if np.linalg.norm(realtime_pose_array.landmark[27] - realtime_pose_array.landmark[28]) < np.linalg.norm(
            result_array.landmark[27] - result_array.landmark[28]
        ):
            recommend.append("もう少し足幅を広げましょう")
        if np.linalg.norm(realtime_pose_array.landmark[15] - realtime_pose_array.landmark[16]) < np.linalg.norm(
            result_array.landmark[15] - result_array.landmark[16]
        ):
            recommend.append("手幅を広げましょう")
        return recommend

    def _caluculate_slkelton():
        print("hello skelton")

    def _stop_pose_process(self):
        self._in_queue.put_nowait(_SENTINEL_)
        self._pose_process.join(timeout=10)

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        display_fps = self._FpsCalculator.get()

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

        # 検出実施 #############################################################
        frame = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
        results: PoseLandmarksObject = self._infer_pose(frame)

        if self.show_2d and results:

            # results -> ndarray (named: realtime_array) : 不要
            self.realtime_array = results

            # リアルタイム処理 ################################################################
            # キーフレームを検出してフレームをリロード
            if self._is_key_frame(self.realtime_array):
                self.loaded_frames = self.positioned_frames.copy()

            # セットの最初にリセットする
            # TODO: 今はボタンがトリガーだが、ゆくゆくは声などになる
            if self.reset_button:
                self._reset_training_set(results)
                self.reset_button = False

            # レップカウントを更新
            self._update_rep_count(results, upper_thre=self.upper_threshold, lower_thre=self.lower_threshold)

            # NOTE: ここに指導がくるので、ndarrayで持ちたい
            # NOTE: または infer_pose -> results to ndarray -> 重ね合わせパラメータ取得・指導の計算 -> ndarray to results -> 描画
            if False:
                print(self._realtime_coaching(results))

            # pose の保存 ################################################################
            if self.pose_save_path is not None:
                self.pose_mem.append(results)
            # results = self._pose.process(image)
            if self.capture_skelton:
                # print(self.skelton_save_path, datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))
                self._save_bone_info(results)
                # print(self.skelton_save_path, datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f"))
                self.capture_skelton = False

            # Poseの描画 ################################################################
            if results.landmark is not None:
                # 描画
                processed_frame = draw_landmarks_pose(
                    processed_frame,
                    results,
                )

            # お手本Poseの描画
            if self.loaded_frames:
                # お手本poseは先に変換しておいてここでは呼ぶだけとする
                processed_frame = self._show_loaded_pose(processed_frame)

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
