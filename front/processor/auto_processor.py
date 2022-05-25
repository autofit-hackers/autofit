import time
from http import server
from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union

import av
import cv2 as cv
import mediapipe as mp
import numpy as np
import sounddevice as sd
import vosk
from apps.pose3d_reconstruction import reconstruct_pose_3d
from PIL import Image
from streamlit_webrtc import VideoProcessorBase
from ui_components.video_widget import CircleHoldButton
from utils import PoseLandmarksObject, draw_landmarks_pose
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, RepObject, RepState, SetObject
from utils.display_objects import CoachPose, DisplayObjects
from utils.voice_recognition import VoiceRecognitionProcess
from utils.instruction import Instruction_Object
from utils.video_recorder import TrainingSaver
from utils.webcam_input import infer_pose, pose_process, process_frame_initially, save_pose, stop_pose_process

_SENTINEL_ = "_SENTINEL_"


class AutoProcessor(VideoProcessorBase):
    def __init__(
        self,
        model_settings: ModelSettings,
        display_settings: DisplaySettings,
        rep_count_settings: RepCountSettings,
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
        self.voice_recognition_process = VoiceRecognitionProcess(stt_api="vosk")
        self.display_settings = display_settings
        self.rep_count_settings = rep_count_settings

        self.phase = 0
        self.training_saver = TrainingSaver()
        self.display_objects = DisplayObjects()
        self.instruction_obj = Instruction_Object()
        self.rep_state = RepState()
        self.hold_button = CircleHoldButton()
        self.set_obj = SetObject()

        # Start other processes
        self._pose_process.start()
        self.voice_recognition_process.start()

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        processed_frame = process_frame_initially(frame=frame, should_rotate=self.display_settings.rotate_webcam_input)

        # 検出実施 #############################################################
        result_pose: PoseLandmarksObject = infer_pose(
            image=processed_frame, in_queue=self._in_queue, out_queue=self._out_queue
        )

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
            print(self.phase)

        # Ph1: メニュー・重量の入力 ################################################################
        elif self.phase == 1:
            # メニュー入力【音声入力！】
            # 重量入力【音声入力！】
            # （回数入力）
            # 必要情報が入力されたら次へ(save path の入力を検知)
            self.phase += 1
            print(self.phase)
            self.coach_pose = CoachPose()

        # Ph2: セットの開始直前まで ################################################################
        elif self.phase == 2:
            # セットの開始入力(声)
            # お手本ポーズのロード
            # 重ね合わせパラメータのリセット
            # セットのパラメータをリセット
            cv.putText(
                processed_frame,
                f"Say Start!",
                (10, 100),
                cv.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv.LINE_AA,
            )
            if self.voice_recognition_process.is_recognized_as(keyword="スタート"):
                self.phase += 1
                print(self.phase)

        # Ph3: セット中 ################################################################
        elif self.phase == 3:
            if result_exists:
                # RepObjectの更新
                self.set_obj.reps[self.rep_state.rep_count - 1].update(pose=result_pose)
                # 回数の更新（updateで回数が増えたらTrue）
                did_count_up = self.rep_state.update_rep(
                    pose=result_pose,
                    upper_thre=self.rep_count_settings.upper_thresh,
                    lower_thre=self.rep_count_settings.lower_thresh,
                )
                # 回数が増えた時、指導を実施する
                if did_count_up:
                    # 音声によるカウントの実施
                    self.rep_state.playsound_rep()

                    # 指導の実施
                    self.set_obj.reps[self.rep_state.rep_count - 2].recalculate_keyframes()
                    self.instruction_obj.execute(rep_obj=self.set_obj.reps[self.rep_state.rep_count - 2])
                    self.set_obj.make_new_rep()

                    # 指導内容の表示
                    self.instruction_obj.show(frame=processed_frame)

            # 保存用配列の更新
            # self.training_saver.update(pose=result_pose, frame=processed_frame, timestamp=recv_timestamp)

            # 終了が入力されたら次へ
            if self.rep_state.rep_count == 8:
                # self.training_saver.save()
                # resultsを生成
                self.phase += 1
                print(self.phase)

        # Ph4: レップ後（レスト中） ################################################################
        elif self.phase == 4:
            # レポート表示
            report_frame = processed_frame * 0
            cv.putText(
                report_frame,
                f"GJ!!Say owari!",
                (10, 30),
                cv.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv.LINE_AA,
            )

            # 次のセットorメニューorログアウト
            # Voice recognition
            if self.voice_recognition_process.is_recognized_as(keyword="終わり"):
                self.phase += 1
                print(self.phase)

            return av.VideoFrame.from_ndarray(report_frame, format="bgr24")

        # Ph5: 次へ進む ################################################################
        else:
            # TODO: 目の前に3つ選択肢が出て、トレーニング終了・次のメニューへ・次のセットへを選択する
            if result_exists:
                self.hold_button.update(frame=processed_frame)
                # スタート検知(キーフレーム検知)されたら次へ
                if self.hold_button.is_pressed(processed_frame, result_pose):
                    # お手本の表示開始
                    self.phase = 1

        self.display_objects.update_and_show(frame=processed_frame, reps=self.rep_state.rep_count)
        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        # Stop other processes
        stop_pose_process(in_queue=self._in_queue, pose_process=self._pose_process)
        self.voice_recognition_process.terminate()
