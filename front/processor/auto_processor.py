from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union
from datetime import datetime
import time

import av
import cv2
import numpy as np
from PIL import Image
from streamlit_webrtc import VideoProcessorBase
from ui_components.video_widget import CircleHoldButton
from utils import PoseLandmarksObject, draw_landmarks_pose
from utils.class_objects import DisplaySettings, ModelSettings, RepCountSettings, RepObject, RepState, SetObject
from utils.display import Display
from utils.display_objects import CoachPose, CoachPoseManager, DisplayObjects, Instruction_Old_ForMitouAD
from utils.instruction import Instructions
from utils.video_recorder import TrainingSaver
from utils.voice_recognition import VoiceRecognitionProcess
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
        self.display_objects = DisplayObjects()
        self.instruction_manager = Instructions()
        self.rep_state = RepState()
        self.hold_button = CircleHoldButton()
        self.set_obj = SetObject()
        self.instruction_img = Image.open("./data/instruction/squat_depth.png")

        # self.cmtx = np.loadtxt(Path("data/camera_info/2022-05-27-09-29/front/mtx.dat"))
        # self.dist = np.loadtxt(Path("data/camera_info/2022-05-27-09-29/front/dist.dat"))
        # print(self.cmtx, self.dist)

        # Start other processes
        self._pose_process.start()
        self.voice_recognition_process.start()

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        recv_timestamp: float =  time.time()

        processed_frame = process_frame_initially(frame=frame, should_rotate=self.display_settings.rotate_webcam_input)
        # h, w = processed_frame.shape[:2]
        # newcameramtx, roi = cv.getOptimalNewCameraMatrix(self.cmtx, self.dist, (w, h), 1, (w, h))
        # processed_frame = cv.undistort(src=processed_frame, cameraMatrix=self.cmtx, distCoeffs=self.dist)
        display = Display(frame=processed_frame)

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
            # TODO: こんちゃんよろしく！！！
            # TODO: QRコード表示
            # TODO: 認証
            # TODO: user_name を認証情報から取得

            # initialize training_saver
            user_name: str = "tmp"
            session_created_at = datetime.now().strftime("%Y-%m-%d-%H-%M")
            save_path = Path("data") / "session" / user_name / session_created_at
            self.training_saver = TrainingSaver(save_path=save_path)

            # 認証したら次へ
            if True:
                self.phase += 1
                print(self.phase)
                self.instruction_manager.show(frame=processed_frame)

        # Ph1: メニュー・重量の入力 ################################################################
        elif self.phase == 1:
            # メニュー入力【音声入力！】
            # 重量入力【音声入力！】
            # （回数入力）

            # 必要情報が入力されたら次へ(save path の入力を検知?)
            if True:
                # お手本ポーズのロード
                self.coach_pose_mgr = CoachPoseManager(coach_pose_path=Path("data/coach_pose/endo_squat.pkl"))
                self.phase += 1
                print(self.phase)

        # Ph2: セットの開始直前まで ################################################################
        elif self.phase == 2:
            # セットのパラメータをリセット
            cv2.putText(
                processed_frame,
                f"Say Start!",
                (10, 100),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )
            # 開始が入力されたら(声)セットを開始
            if self.voice_recognition_process.is_recognized_as(keyword="スタート") and result_exists:
                # お手本ポーズのリセット
                self.coach_pose_mgr.setup_coach_pose(current_pose=result_pose)
                self.instruction.update_knee_y(pose=result_pose, frame_height=processed_frame.shape[0])
                self.phase += 1
                print(self.phase)

        # Ph3: セット中 ################################################################
        elif self.phase == 3:
            if result_exists:
                # お手本ポーズの更新
                self.coach_pose_mgr.show_coach_pose(frame=processed_frame)
                # keyframeが検知（レップが開始）された時、お手本ポーズをReload
                if self.rep_state.is_keyframe(pose=result_pose):
                    self.coach_pose_mgr.reload_coach_pose()

                # RepObjectの更新
                self.set_obj.reps[self.rep_state.rep_count - 1].update(pose=result_pose)
                # 回数の更新（updateで回数が増えたらTrue）
                did_count_up = self.rep_state.update_rep(
                    pose=result_pose,
                    upper_thre=self.rep_count_settings.upper_thresh,
                    lower_thre=self.rep_count_settings.lower_thresh,
                )

                # 手動の指導
                if self.rep_state.rep_count >= 2:
                    line_color = self.instruction.check_pose(pose=result_pose, frame_height=processed_frame.shape[0])
                    processed_frame = display.image(
                        image=self.instruction_img, position=(0.45, 0.05), size=(0.52, 0), hold_aspect_ratio=True
                    )

                # 回数が増えた時、指導を実施する
                if did_count_up:
                    # 音声によるカウントの実施
                    self.rep_state.playsound_rep()

                    # 指導の実施
                    self.set_obj.reps[self.rep_state.rep_count - 2].recalculate_keyframes()
                    # self.instruction_manager.evaluate_rep(rep_obj=self.set_obj.reps[self.rep_state.rep_count - 2])
                    self.set_obj.make_new_rep()

                    # 指導内容の表示
                    # self.instruction_manager.show_instruction(frame=processed_frame)

            # 保存用配列の更新
            self.training_saver.update(pose=result_pose, frame=processed_frame, timestamp=recv_timestamp)

            # 終了が入力されたら次へ
            if self.rep_state.rep_count == 8:
                self.training_saver.save()
                # resultsを生成
                self.phase += 1
                print(self.phase)

        # Ph4: レップ後（レスト中） ################################################################
        elif self.phase == 4:
            # レポート表示
            # TODO: @katsura ここでdisplay

            # 次のセットorメニューorログアウトに進む（Ph5とマージ予定）
            if self.voice_recognition_process.is_recognized_as(keyword="終わり"):
                self.phase += 1
                print(self.phase)

            return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

        # Ph5: 次へ進む ################################################################
        else:
            # TODO: 目の前に3つ選択肢が出て、トレーニング終了・次のメニューへ・次のセットへを選択する
            if result_exists:
                self.hold_button.update(frame=processed_frame, text="Start")
                # スタート検知(キーフレーム検知)されたら次へ
                if self.hold_button.is_pressed(processed_frame, result_pose):
                    # お手本の表示開始
                    self.phase = 1

        self.display_objects.update_and_show(frame=processed_frame, reps=self.rep_state.rep_count)
        return av.VideoFrame.from_ndarray(processed_frame, format="bgr24")

    def __del__(self):
        # TODO: 桂くんへ（@katsura）ここに以下の感じでレポート生成を呼び出し
        # image = get_training_report(self.training_results)

        print("Stop the inference process...")
        stop_pose_process(in_queue=self._in_queue, pose_process=self._pose_process)
        self.voice_recognition_process.terminate()
