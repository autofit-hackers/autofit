import copy
from http import server
import json
import os
import pickle
import re
import time
from multiprocessing import Process, Queue
from pathlib import Path
from turtle import color
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
from PIL import Image
from apps.pose3d_reconstruction import reconstruct_pose_3d
from streamlit_webrtc import VideoProcessorBase
from ui_components.video_widget import ResetButton
from utils import FpsCalculator, PoseLandmarksObject, draw_landmarks_pose, mp_res_to_pose_obj
from utils import display_objects
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, RepState, SaveStates
from utils.display_objects import CoachPose, DisplayObjects, Instruction
from utils.draw_pose import draw_joint_angle_2d
from utils.video_recorder import create_video_writer, release_video_writer
from utils.webcam_input import infer_pose, pose_process, process_frame_initially, save_pose, stop_pose_process

_SENTINEL_ = "_SENTINEL_"


class AutoProcessor(VideoProcessorBase):
    def __init__(
        self,
        model_settings: ModelSettings,
        is_saving: bool,
        display_settings: DisplaySettings,
        rep_count_settings: RepCountSettings,
        training_mode: str,
        uploaded_pose_file=None,
        uploaded_instruction_file=None,
        is_clicked_reset_button: bool = False,
        video_save_path: Union[str, None] = None,
        pose_save_path: Union[str, None] = None,
    ) -> None:
        self._in_queue = Queue()
        self._out_queue = Queue()
        self._pose_process = Process(
            target=pose_process,
            kwargs={
                "in_queue": self._in_queue,
                "out_queue": self._out_queue,
                "model_settings": model_settings,
            },
        )
        self._FpsCalculator = FpsCalculator(buffer_len=10)

        self.is_saving = is_saving
        self.display_settings = display_settings
        self.rep_count_settings = rep_count_settings

        self.is_clicked_reset_button = is_clicked_reset_button

        self.video_save_path = video_save_path
        self.video_writer: Union[cv.VideoWriter, None] = None

        self.pose_save_path: Union[str, None] = pose_save_path
        self.pose_memory: List[PoseLandmarksObject] = []

        self.rep_state: RepState = RepState()
        self.coaching_contents: List[str] = []

        self.coach_pose = CoachPose()
        if uploaded_pose_file:
            self.coach_pose._set_coach_pose(uploaded_pose_file=uploaded_pose_file)
        self.instruction = Instruction()

        if uploaded_instruction_file:
            img = Image.open(uploaded_instruction_file)
            self.instruction_file = np.array(img)
        else:
            self.instruction_file = np.array([[[1, 1, 1, 1]]])

        self.reset_button = ResetButton()

        self.display_objects = DisplayObjects()

        self._pose_process.start()

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        recv_timestamp: float = time.time()
        processed_frame = process_frame_initially(frame=frame, should_rotate=self.display_settings.rotate_webcam_input)

        # 検出実施 #############################################################
        result_pose: PoseLandmarksObject = infer_pose(
            image=processed_frame, in_queue=self._in_queue, out_queue=self._out_queue
        )
        self.reset_button.visualize(frame=processed_frame)  # TODO: display objects全体のリフレッシュに書き換え

        if result_pose:
            # Ph0: QRコードログイン
            #   QRコード検知
            #   認証
            #   認証したら次へ
            # Ph1: メニュー・重量の決定（何をどれだけやるかの決定）
            #   メニュー入力
            #   重量入力
            #   （回数入力）
            #   必要情報が入力されたら次へ
            # Ph2: レップの開始直前まで
            #   セットの開始入力(声)
            #   重ね合わせやセットのパラメータをリセット
            #   お手本の表示開始
            #   スタート検知(キーフレーム検知)されたら次へ
            # Ph3: レップ中
            #   回数
            #   指導
            #   終了が入力されたら次へ
            # Ph4: レップ後
            #   レポート表示
            #   次のセットorメニューorログアウト

            if self.reset_button.is_pressed(processed_frame, result_pose):
                self.rep_state = self.coach_pose._reset_training_set(
                    realtime_pose=result_pose, rep_state=self.rep_state
                )
                self.is_clicked_reset_button = False
                self.instruction.update_knee_y(pose=result_pose, frame_height=processed_frame.shape[0])
                # self.penguin_count = 90

            if self.rep_count_settings.do_count_rep:
                # レップカウントを更新
                assert self.rep_count_settings.upper_thresh is not None
                assert self.rep_count_settings.lower_thresh is not None
                self.rep_state.update_rep(
                    pose=result_pose,
                    upper_thre=self.rep_count_settings.upper_thresh,
                    lower_thre=self.rep_count_settings.lower_thresh,
                )

            # キーフレームを検出してフレームをリロード
            if self.rep_state.is_keyframe(pose=result_pose):
                self.coach_pose._reload_pose()
                color = (0, 0, 255)
            else:
                color = (255, 0, 0)

            # Poseの描画 ################################################################
            processed_frame = draw_landmarks_pose(processed_frame, result_pose, pose_color=(0, 255, 255), show_z=False)

            # お手本Poseの描画
            # if self.coach_pose.uploaded_frames and self.coach_pose.loaded_frames is not None:
            #     processed_frame = self.coach_pose._show_loaded_pose(processed_frame)

            # 指導
            # if self.rep_state.rep_count >= 1:
            #     line_color = self.instruction.check_pose(pose=result_pose, frame_height=processed_frame.shape[0])
            #     frame = self.instruction.show_instruction_image(
            #         frame=processed_frame, line_color=line_color, instruction_image=self.instruction_file
            #     )
            # self.instruction._proceed_frame()

        # pose の保存 (pose_mem への追加) ########################################################
        if self.is_saving and self.pose_save_path is not None:
            self.pose_memory.append(
                result_pose
                if result_pose
                else PoseLandmarksObject(
                    landmark=np.zeros(shape=(33, 3)), visibility=np.zeros(shape=(33, 1)), timestamp=recv_timestamp
                )
            )  # NOTE: ビデオのフレームインデックスとposeのフレームインデックスを一致させるために、2D Pose Estimation ができなかった場合は zero padding

        # pose の保存（書き出し）
        if (len(self.pose_memory) > 0) and (not self.is_saving):
            save_pose(pose_save_path=self.pose_save_path, pose_memory=self.pose_memory)
            # self._reconstruct_pose_3d
            self.pose_memory = []

        self.display_objects.update_and_show(frame=processed_frame, reps=self.rep_state.rep_count)

        # Visualize reset button
        self.reset_button.visualize(processed_frame)

        # 動画の保存
        if self.is_saving:
            # 初期化
            if self.video_writer is None:
                assert self.video_save_path is not None
                frame_to_save = av.VideoFrame.from_ndarray(frame, format="rgb24")
                self.video_writer = create_video_writer(
                    fps=30, frame=frame_to_save, video_save_path=self.video_save_path
                )
                print(f"initialized video writer to save {self.video_save_path}")
            # 動画の保存（フレームの追加）
            self.video_writer.write(processed_frame)

        # 動画の保存（writerの解放）
        if (not self.is_saving) and (self.video_writer is not None):
            release_video_writer(video_writer=self.video_writer, video_save_path=self.video_save_path)

        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        stop_pose_process(in_queue=self._in_queue, pose_process=self._pose_process)
