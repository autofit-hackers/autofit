import copy
from genericpath import exists
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
from unittest import result

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
from PIL import Image
from apps.pose3d_reconstruction import reconstruct_pose_3d
from streamlit_webrtc import VideoProcessorBase
from ui_components.video_widget import CircleHoldButton, ResetButton
from utils import FpsCalculator, PoseLandmarksObject, draw_landmarks_pose, mp_res_to_pose_obj
from utils import display_objects
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, RepState, SaveStates
from utils.display_objects import CoachPose, DisplayObjects, Instruction
from utils.draw_pose import draw_joint_angle_2d
from utils.video_recorder import TrainingSaver, create_video_writer, release_video_writer
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
        self.display_settings = display_settings
        self.rep_count_settings = rep_count_settings

        self.phase = 0
        self.training_saver = TrainingSaver()
        self.display_objects = DisplayObjects()
        self.instruction = Instruction()
        self.rep_state: RepState = RepState()
        self.coaching_contents: List[str] = []
        self.coach_pose = CoachPose()
        if uploaded_pose_file:
            self.coach_pose._set_coach_pose(uploaded_pose_file=uploaded_pose_file)
        self.hold_button = CircleHoldButton()

        self._pose_process.start()

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        recv_timestamp: float = time.time()
        processed_frame = process_frame_initially(frame=frame, should_rotate=self.display_settings.rotate_webcam_input)

        # 検出実施 #############################################################
        result_pose: PoseLandmarksObject = infer_pose(
            image=processed_frame, in_queue=self._in_queue, out_queue=self._out_queue
        )
        # self.reset_button.visualize(frame=processed_frame)  # TODO: display objects全体のリフレッシュに書き換え

        result_exists = result_pose is not None
        # Poseの描画 ################################################################
        if result_exists:
            processed_frame = draw_landmarks_pose(processed_frame, result_pose, pose_color=(0, 255, 255), show_z=False)

        # Ph0: QRコードログイン ################################################################
        if self.phase == 0:
            # QRコード検知
            # 認証
            # 認証したら次へ
            self.phase += 1
        # Ph1: メニュー・重量の入力 ################################################################
        elif self.phase == 1:
            # メニュー入力【音声入力！】
            # 重量入力【音声入力！】
            # （回数入力）
            # 必要情報が入力されたら次へ
            self.phase += 1
        # Ph2: レップの開始直前まで
        elif self.phase == 2:
            # セットの開始入力(声)
            # お手本ポーズのロード
            # 重ね合わせパラメータのリセット
            # セットのパラメータをリセット
            if result_exists:
                self.hold_button.update(frame=processed_frame)
                # スタート検知(キーフレーム検知)されたら次へ
                if self.hold_button.is_pressed(processed_frame, result_pose):
                    self.phase += 1
                    # お手本の表示開始
        # Ph3: レップ中 ################################################################
        elif self.phase == 3:
            # 回数の更新
            self.rep_state.update_rep(
                pose=result_pose,
                upper_thre=self.rep_count_settings.upper_thresh,
                lower_thre=self.rep_count_settings.lower_thresh,
            )
            # 指導

            # 保存用配列の更新
            self.training_saver.update(pose=result_pose, frame=processed_frame, timestamp=recv_timestamp)

            # 終了が入力されたら次へ
            if self.rep_state.rep_count == 8:
                self.training_saver.save()
                self.phase += 1

        # Ph4: レップ後 ################################################################
        elif self.phase == 4:
            # レポート表示
            # 次のセットorメニューorログアウト
            self.phase += 1

        self.display_objects.update_and_show(frame=processed_frame, reps=self.rep_state.rep_count)
        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        stop_pose_process(in_queue=self._in_queue, pose_process=self._pose_process)
