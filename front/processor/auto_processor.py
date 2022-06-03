import imp
from multiprocessing import Process, Queue
from pathlib import Path
from typing import List, Union
from datetime import datetime
import time
import io

import av
import cv2
from lib.webrtc_ui.training_report import generate_data_report, generate_png_report
from lib.pose.draw_pose import draw_landmarks_pose
from utils.class_objects import PoseLandmarksObject
from lib.pose.training_set import RepState, SetObject
import lib.streamlit_ui.setting_class as settings
import numpy as np
import lib.webrtc_ui.display as disp
from PIL import Image
from streamlit_webrtc import VideoProcessorBase
from lib.webrtc_ui.video_widget import CircleHoldButton
from lib.webrtc_ui.display_objects import CoachPose, CoachPoseManager, DisplayObjects
from core.instruction import Instructions
from lib.webrtc_ui.video_recorder import TrainingSaver
from lib.webrtc_ui.voice_recognition import VoiceRecognitionProcess
from lib.webrtc_ui.webcam_input import infer_pose, pose_process, process_frame_initially, save_pose, stop_pose_process
import lib.webrtc_ui.display as disp


_SENTINEL_ = "_SENTINEL_"


class AutoProcessor(VideoProcessorBase):
    def __init__(
        self,
        model_settings: settings.ModelSettings,
        display_settings: settings.DisplaySettings,
        rep_count_settings: settings.RepCountSettings,
        audio_settings: settings.AudioSettings,
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
        self.voice_recognition_process = VoiceRecognitionProcess(
            stt_api="vosk", device_id=audio_settings.audio_device_id
        )
        self.display_settings = display_settings
        self.rep_count_settings = rep_count_settings
        self.audio_settings = audio_settings

        self.phase = 0
        self.display_objects = DisplayObjects()
        self.instructions = Instructions()
        self.rep_state = RepState()
        self.hold_button = CircleHoldButton()
        self.set_obj = SetObject(menu="squat", weight=50)

        if self.display_settings.correct_distortion:
            self.cmtx = np.loadtxt(Path("data/camera_info/2022-05-27-09-29/front/mtx.dat"))
            self.dist = np.loadtxt(Path("data/camera_info/2022-05-27-09-29/front/dist.dat"))
        # print(self.cmtx, self.dist)

        # Start other processes
        self._pose_process.start()
        self.voice_recognition_process.start()

    def recv(self, frame: av.VideoFrame) -> av.VideoFrame:
        recv_timestamp: float = time.time()

        frame = process_frame_initially(frame=frame, should_rotate=self.display_settings.rotate_webcam_input)
        if self.display_settings.correct_distortion:
            h, w = frame.shape[:2]
            newcameramtx, roi = cv2.getOptimalNewCameraMatrix(self.cmtx, self.dist, (w, h), 1, (w, h))
            frame = cv2.undistort(src=frame, cameraMatrix=self.cmtx, distCoeffs=self.dist)

        # 検出実施 #############################################################
        result_pose: PoseLandmarksObject = infer_pose(image=frame, in_queue=self._in_queue, out_queue=self._out_queue)
        exists_result = result_pose is not None

        # Poseの描画 ################################################################
        if exists_result:
            frame = draw_landmarks_pose(frame, result_pose, pose_color=(0, 255, 255), show_z=False)

        # Ph0: QRコードログイン ################################################################
        if self.phase == 0:
            # TODO: こんちゃんよろしく！！！
            # TODO: QRコード表示
            # TODO: 認証
            # TODO: user_name を認証情報から取得
            self.user_name: str = "tmp"

            # 認証したら次へ
            if self.user_name:
                self.phase += 1
                print("training phase: ", self.phase)

        # Ph1: メニュー・重量の入力 ################################################################
        elif self.phase == 1:
            # メニュー入力【音声入力！】
            # 重量入力【音声入力！】
            # （回数入力）

            # 必要情報が入力されたら次へ(save path の入力を検知?)
            if True:
                # initialize training saver
                session_created_at = datetime.now().strftime("%Y-%m-%d-%H-%M")
                menu_name: str = "squat"
                save_path = Path("data") / "training" / self.user_name / menu_name / session_created_at
                self.training_saver = TrainingSaver(save_path=save_path)
                # お手本ポーズのロード
                # XXX: ハードコードなので注意
                self.coach_pose_mgr = CoachPoseManager(coach_pose_path=Path("data/coach_pose/endo_squat.pkl"))
                self.phase += 1
                print("training phase: ", self.phase)

        # Ph2: セットの開始直前まで ################################################################
        elif self.phase == 2:
            # セットのパラメータをリセット
            cv2.putText(
                frame,
                f"Say Start!",
                (10, 100),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

            # 開始が入力されたら(声)セットを開始
            if (self.voice_recognition_process.is_recognized_as(keyword="スタート") or True) and exists_result:
                # お手本ポーズのリセット
                self.coach_pose_mgr.setup_coach_pose(current_pose=result_pose)
                self.phase += 1
                self.set_obj.make_new_rep()
                print("training phase: ", self.phase)

        # Ph3: セット中 ################################################################
        elif self.phase == 3:
            if exists_result:
                # お手本ポーズの更新
                self.coach_pose_mgr.show_coach_pose(frame=frame)
                # keyframeが検知（レップが開始）された時、お手本ポーズをReload
                if self.rep_state.is_keyframe(pose=result_pose):
                    self.coach_pose_mgr.reload_coach_pose()

                # 実行中のRepに推定poseを記録
                self.set_obj.reps[self.rep_state.rep_count].record_pose(pose=result_pose)

                # レップ数の更新（updateで回数が増えたらTrue）
                is_last_frame_in_rep = self.rep_state.update_rep_count(
                    pose=result_pose,
                    upper_thre=self.rep_count_settings.upper_thresh,
                    lower_thre=self.rep_count_settings.lower_thresh,
                )

                # レップカウントが増えた時、フォーム評価を実施する
                if is_last_frame_in_rep:
                    # レップカウントの音声出力
                    if self.audio_settings.play_audio:
                        self.rep_state.playsound_rep()

                    # 直前のレップのフォームを評価
                    self.set_obj.reps[self.rep_state.rep_count - 1].recalculate_keyframes()
                    self.instructions.evaluate_rep(rep_obj=self.set_obj.reps[self.rep_state.rep_count - 1])
                    self.set_obj.make_new_rep()

                # 2レップ目以降はガイドラインと指導テキストを表示
                if self.rep_state.rep_count >= 1:
                    frame = self.instructions.show_text(frame=frame)
                    self.instructions.show_guideline(frame=frame, pose=result_pose, set_obj=self.set_obj)

            # 保存用配列の更新
            self.training_saver.update(pose=result_pose, frame=frame, timestamp=recv_timestamp)

            # 終了が入力されたら次へ
            if self.rep_state.rep_count == 8:
                self.training_saver.save()
                self.phase += 1
                print("training phase: ", self.phase)

                # training_reportをpngにする
                # TODO: 指示内容に合わせた画像を提示
                training_result = generate_data_report()
                template_report_path = Path("/template/training_report_display.jinja")
                self.training_result_display_png = generate_png_report(training_result, str(template_report_path))
                self.training_result_display_png = Image.open(io.BytesIO(self.training_result_display_png))

        # Ph4: レップ後（レスト中） ################################################################
        elif self.phase == 4:
            # training_reportを表示させる
            frame = disp.image(
                frame=frame,
                image=self.training_result_display_png,
                position=(0.1, 0.05),
                size=(0.8, 0),
                hold_aspect_ratio=True,
            )

            # 次のセットorメニューorログアウトに進む（Ph5とマージ予定）
            if self.voice_recognition_process.is_recognized_as(keyword="終わり"):
                self.phase += 1
                print("training phase: ", self.phase)

            return av.VideoFrame.from_ndarray(frame, format="bgr24")

        # Ph5: 次へ進む ################################################################
        else:
            # TODO: 目の前に3つ選択肢が出て、トレーニング終了・次のメニューへ・次のセットへを選択する
            if exists_result:
                self.hold_button.update(frame=frame, text="Start")
                # スタート検知(キーフレーム検知)されたら次へ
                if self.hold_button.is_pressed(frame, result_pose):
                    # お手本の表示開始
                    self.phase = 1

        self.display_objects.update_and_show(frame=frame, reps=self.rep_state.rep_count)
        return av.VideoFrame.from_ndarray(frame, format="bgr24")

    def __del__(self):
        print("Stop the inference process...")
        stop_pose_process(in_queue=self._in_queue, pose_process=self._pose_process)
        self.voice_recognition_process.terminate()
