import pickle
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, List, Union

import cv2
import av
import numpy as np
from utils.class_objects import PoseLandmarksObject
from lib.pose.draw_pose import draw_landmarks_pose
from lib.pose.training_set import RepState
from lib.webrtc_ui.calculate_fps import FpsCalculator


class CoachPoseManager:
    def __init__(self, coach_pose_path: Path) -> None:
        with open(coach_pose_path, "rb") as f:
            self.base_coach_pose: List[PoseLandmarksObject] = pickle.load(f)

    def setup_coach_pose(self, current_pose):
        """セットの開始時に呼ばれる

        Args:
            current_pose (_type_): _description_
        """
        self.adjusted_coach_pose = self._adjust_poses(current_pose=current_pose)
        self.reload_coach_pose()

    def reload_coach_pose(self):
        """レップの開始時に呼ばれる"""
        self.coach_pose_to_load = self.adjusted_coach_pose.copy()

    def show_coach_pose(self, frame):
        """毎フレーム呼ばれる

        Args:
            frame (_type_): _description_

        Returns:
            _type_: _description_
        """
        self._load_coach_pose()
        frame = draw_landmarks_pose(frame, self.coach_pose_to_show, pose_color=(0, 255, 0))
        return frame

    def _adjust_poses(self, current_pose: PoseLandmarksObject) -> List[PoseLandmarksObject]:
        current_height = current_pose.get_2d_height()
        coach_height = self.base_coach_pose[0].get_2d_height()
        scale = current_height / coach_height

        current_foot_position = current_pose.get_foot_position()
        coach_foot_position = self.base_coach_pose[0].get_foot_position() * scale
        slide: np.ndarray = current_foot_position - coach_foot_position
        slide[2] = 0

        adjusted_poses = [
            PoseLandmarksObject(
                landmark=pose.landmark * scale + slide, visibility=pose.visibility, timestamp=pose.timestamp
            )
            for pose in self.base_coach_pose
        ]
        return adjusted_poses

    def _load_coach_pose(self):
        if len(self.coach_pose_to_load) > 0:
            self.coach_pose_to_show = self.coach_pose_to_load.pop(0)


class DisplayObjects:
    reps = 0
    fps = 0
    fpsCalculator = FpsCalculator(buffer_len=10)

    def update_and_show(self, frame, reps):
        self.update(reps=reps)
        self.show(frame)

    def update(self, reps):
        self.reps = reps
        self.fps = self.fpsCalculator.get()

    def show(self, frame):
        cv2.putText(
            frame,
            f"Rep:{self.reps}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            frame,
            "FPS:" + format(self.fps, ".0f"),
            (10, 60),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, max(min(self.fps - 20, 10) * 25.5, 0), 255 - max(min(self.fps - 20, 10) * 25.5, 0)),
            2,
            cv2.LINE_AA,
        )

    def reset(self):
        self.reps = 0


class CoachPose:
    loaded_frames: List[PoseLandmarksObject]
    uploaded_frames: List[PoseLandmarksObject] = []
    positioned_frames: List[PoseLandmarksObject] = []

    def set_coach_pose(self, uploaded_pose_file: Any = None, uploaded_pose_path: Union[Path, None] = None):
        if uploaded_pose_path is not None and uploaded_pose_file is None:
            uploaded_pose_file = uploaded_pose_path.read_bytes()
        if uploaded_pose_file is not None:
            self.uploaded_frames = pickle.load(uploaded_pose_file)
            self.loaded_frames = self.uploaded_frames.copy()

    def _adjust_poses(
        self, realtime_pose: PoseLandmarksObject, loaded_frames: List[PoseLandmarksObject], start_frame_idx: int = 0
    ) -> List[PoseLandmarksObject]:
        realtime_height = realtime_pose.get_2d_height()
        loaded_height = loaded_frames[start_frame_idx].get_2d_height()
        scale = realtime_height / loaded_height  # スケーリング用の定数

        realtime_foot_position = realtime_pose.get_foot_position()
        loaded_foot_position = loaded_frames[start_frame_idx].get_foot_position() * scale

        # 位置合わせ用の[x,y,0]のベクター
        slide: np.ndarray = realtime_foot_position - loaded_foot_position
        slide[2] = 0
        print(scale, slide)

        adjusted_poses = [
            PoseLandmarksObject(
                landmark=frame.landmark * scale + slide, visibility=frame.visibility, timestamp=frame.timestamp
            )
            for frame in loaded_frames
        ]
        return adjusted_poses

    def _reset_training_set(self, realtime_pose: PoseLandmarksObject, rep_state: RepState):
        if self.uploaded_frames:
            self.positioned_frames = self._adjust_poses(realtime_pose, self.uploaded_frames)
            self.loaded_frames = self.positioned_frames.copy()

        rep_state.reset_rep(pose=realtime_pose)
        # print(rep_state.initial_body_height)
        return rep_state

    def _show_loaded_pose(self, frame):
        if len(self.loaded_frames) > 0:
            self.coach_pose_now = self.loaded_frames.pop(0)
        frame = draw_landmarks_pose(frame, self.coach_pose_now, pose_color=(0, 255, 0))
        return frame

    def _reload_pose(self):
        if self.positioned_frames:
            self.loaded_frames = self.positioned_frames.copy()

    def _update_realtime_coaching(self, pose: PoseLandmarksObject) -> None:
        recommend = ["squat"]
        if np.linalg.norm(pose.landmark[27] - pose.landmark[28]) < np.linalg.norm(
            self.coach_pose_now.landmark[27] - self.coach_pose_now.landmark[28]
        ):
            recommend.append("もう少し足幅を広げましょう")
        if np.linalg.norm(pose.landmark[15] - pose.landmark[16]) < np.linalg.norm(
            self.coach_pose_now.landmark[15] - self.coach_pose_now.landmark[16]
        ):
            recommend.append("手幅を広げましょう")
        self.coaching_contents = recommend


######################################### old ##############################################
@dataclass
class Instruction_Old_ForMitouAD:
    display_frames: int = 60
    instruction_words = ["Drop your hips until your", "thighs are level."]  # "太ももが水平になるまで腰を落としましょう"
    mistake_reason: str = "#### 太ももが水平になるまで腰を落とせるともっと良くなります。お尻の筋肉が比較的弱く、深いスクワットができない可能性があります。"
    is_displaying: bool = True
    knee_y = 0

    def _proceed_frame(self):
        print(self.display_frames)
        if self.display_frames > 0:
            self.display_frames -= 1
        else:
            self.is_displaying = False

    def _display_start(self):
        self.display_frames = 60
        self.is_displaying = True

    def _draw_for_prototype(self, frame, line_color):
        if self.is_displaying:
            cv2.rectangle(frame, (200, 10), (470, 110), (255, 255, 255), thickness=-1)
            cv2.line(frame, (100, self.knee_y), (380, self.knee_y), line_color, thickness=2, lineType=cv2.LINE_AA)
            for count, words in enumerate(self.instruction_words):
                cv2.putText(
                    frame,
                    words,
                    (210, 40 * (count + 1)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 0, 255),
                    2,
                    cv2.LINE_AA,
                )
        return frame

    def show_instruction_image(self, frame, line_color, instruction_image):
        if self.is_displaying:
            self.two_images(src=instruction_image, dst=frame)
            # width, height = instruction_image.shape[:2]
            # frame_w, frame_h = frame.shape[:2]
            # frame[10 : width + 10, frame_h - 10 - height : frame_h - 10] = instruction_image[:, :, :3]
            cv2.line(
                frame, (100, self.knee_y + 20), (380, self.knee_y + 20), line_color, thickness=2, lineType=cv2.LINE_AA
            )
        return frame

    def update_knee_y(self, pose: PoseLandmarksObject, frame_height: int):
        self.knee_y = int(pose.get_knee_position()[1] * frame_height)

    def check_pose(self, pose: PoseLandmarksObject, frame_height: int):
        if self.knee_y > int(pose.get_hip_position()[1] * frame_height):
            return (0, 0, 255)
        else:
            return (0, 255, 0)

    def two_images(self, src: np.ndarray, dst: np.ndarray):
        height, width = src.shape[:2]
        frame_h, frame_w = dst.shape[:2]

        mask = src[:, :, 3]  # アルファチャンネルだけ抜き出す。
        # mask = mask.T
        mask = mask[:, :, np.newaxis]
        mask = np.tile(mask, reps=(1, 1, 3))  # 3色分に増やす。
        mask = mask / 255.0  # 0-255だと使い勝手が悪いので、0.0-1.0に変更。

        src = src[:, :, :3]  # .transpose(1, 0, 2)  # アルファチャンネルは取り出しちゃったのでもういらない。

        w0 = 10
        w1 = height + 10
        h0 = frame_w - width - 10
        h1 = frame_w - 10
        dst[w0:w1:, h0:h1] = dst[w0:w1:, h0:h1] * (1.0 - mask)  # 透過率に応じて元の画像を暗くする。
        dst[w0:w1:, h0:h1] = dst[w0:w1:, h0:h1] + src * mask  # 貼り付ける方の画像に透過率をかけて加算。
        return dst
