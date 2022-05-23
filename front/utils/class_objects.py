import json
import pickle
import time
from dataclasses import dataclass, field
from dis import dis
from distutils.command.upload import upload
from pathlib import Path
from typing import Any, List, NamedTuple, Union

import numpy as np
import pandas as pd
import streamlit as st
from playsound import playsound


class PoseLandmarksObject(NamedTuple):
    """
    landmark.shape == (33, 3)  #（関節数, xyz）
    visibility.shape == (33, 1)
    """
    landmark: np.ndarray
    visibility: np.ndarray
    timestamp: Union[float, None]

    def get_height(self) -> np.double:
        neck = (self.landmark[11] + self.landmark[12]) / 2
        foot_center = (self.landmark[27] + self.landmark[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def get_2d_height(self) -> np.double:
        neck = (self.landmark[11] + self.landmark[12]) / 2
        foot_center = (self.landmark[27] + self.landmark[28]) / 2
        return abs((neck - foot_center)[1])

    def get_foot_position(self) -> np.ndarray:
        return (self.landmark[27] + self.landmark[28]) / 2

    def get_knee_position(self) -> np.ndarray:
        return (self.landmark[25] + self.landmark[26]) / 2

    def get_hip_position(self) -> np.ndarray:
        return (self.landmark[23] + self.landmark[24]) / 2

    def get_keypoint(self, training_name: str) -> np.ndarray:
        if training_name == "squat":
            return (self.landmark[11] + self.landmark[12]) / 2
        else:
            return (self.landmark[11] + self.landmark[12]) / 2

    # デフォルトでは左足の角度
    def get_joint_angle(self, three_joints: List[int] = [25, 27, 31]):
        landmark = self.landmark

        joint1 = landmark[three_joints[0]]
        joint2 = landmark[three_joints[1]]
        joint3 = landmark[three_joints[2]]
        vec1 = joint1 - joint2
        vec2 = joint3 - joint2

        inner_product = np.inner(vec1, vec2)
        cos = inner_product / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

        # 角度（ラジアン）の計算
        rad = np.arccos(cos)
        # 弧度法から度数法（rad ➔ 度）への変換
        degree = np.rad2deg(rad)

        return degree

    def get_bone_lengths(self) -> dict:
        # FIXME: foot_neck_heightだけPoseDefに存在しない
        bone_dict = {"foot_neck_height": self.get_height()}
        for bone_edge_key in PoseDef.bone_edge_names.keys():
            bone_dict[bone_edge_key] = np.linalg.norm(
                self.landmark[PoseDef.bone_edge_names[bone_edge_key][0]]
                - self.landmark[PoseDef.bone_edge_names[bone_edge_key][1]]
            )
        return bone_dict

    def save_bone_lengths(self, save_path: Path) -> dict:
        print(save_path)
        bone_dict = self.get_bone_lengths()
        assert save_path
        with open(save_path, "w") as f:
            json.dump(bone_dict, f)
            st.write("Successfully Saved")
        return bone_dict

    def crapped_hands(self) -> bool:
        hands = abs(self.landmark[15] - self.landmark[16])
        distance = hands[0] * hands[0] + hands[1] * hands[1]
        return distance < 0.01

class RepObject:
    poses: List[PoseLandmarksObject]
    keyframes: dict
    rep_number: int

@dataclass
class ModelSettings:
    model_complexity: int
    min_detection_confidence: float
    min_tracking_confidence: float


@dataclass
class DisplaySettings:
    rotate_webcam_input: bool
    show_fps: bool
    show_2d: bool


@dataclass
class RepCountSettings:
    do_count_rep: bool
    upper_thresh: float
    lower_thresh: float


@dataclass
class SaveSettings:
    base_save_dir: Union[Path, None] = None
    key: Union[str, None] = None

    # video
    video_save_dir: Union[Path, None] = None
    video_save_path: Union[str, None] = None  # FIXME: duplicated

    # pose
    pose_save_dir: Union[Path, None] = None
    pose_save_path: Union[str, None] = None  # FIXME: duplicated

    # skeleton
    skeleton_save_path: Union[str, None] = None


@dataclass(frozen=False)
class SaveStates:
    is_saving_video: bool = False
    is_saving_pose: bool = False


class UploadSettings:
    def __init__(self, uploaded_pose):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class OperationStates:
    def __init__(
        self,
        reload_pose: bool,
        capture_skeleton: bool,
        is_clicked_reset_button: bool,
    ):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class PoseStates:
    def __init__(self):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class CalibrationSettings:
    def __init__(self):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


def mp_res_to_pose_obj(mp_res, timestamp: Union[float, None]) -> PoseLandmarksObject:
    assert hasattr(mp_res, "pose_landmarks")
    assert hasattr(mp_res.pose_landmarks, "landmark")
    picklable_results = PoseLandmarksObject(
        landmark=np.array(
            [[pose_landmark.x, pose_landmark.y, pose_landmark.z] for pose_landmark in mp_res.pose_landmarks.landmark]
        ),
        visibility=np.array([pose_landmark.visibility for pose_landmark in mp_res.pose_landmarks.landmark]),
        timestamp=timestamp,
    )
    return picklable_results


@dataclass
class RepState:
    rep_count: int = 0
    is_lifting_up = False
    did_touch_bottom = False
    did_touch_top = True
    initial_body_height = 0
    tmp_body_heights: List[np.double] = field(default_factory=list)

    body_heights_df: pd.DataFrame = pd.DataFrame(columns=["time", "height", "velocity"])

    def _init_rep(self, height: np.double):
        self.initial_body_height = height
        self.tmp_body_heights = [self.initial_body_height] * 10

    def update_rep(self, pose: PoseLandmarksObject, lower_thre, upper_thre):
        height = pose.get_2d_height()
        if len(self.tmp_body_heights) < 10:
            self._init_rep(height=height)
        self._update_counter(height=height, lower_thre=lower_thre, upper_thre=upper_thre)
        self._update_lifting_state(height=height)

        velocity = self.tmp_body_heights[9] - self.tmp_body_heights[0]
        self.body_heights_df = pd.concat(
            [self.body_heights_df, pd.DataFrame({"time": [time.time()], "height": [height], "velocity": [velocity]})],
            ignore_index=True,
        )

    def _update_counter(self, height: np.double, lower_thre, upper_thre):
        if not self.did_touch_bottom and height < self.initial_body_height * lower_thre:
            self.did_touch_bottom = True
        elif self.did_touch_bottom and height > self.initial_body_height * upper_thre:
            self.rep_count += 1
            self._playsound_rep()
            self.did_touch_bottom = False

    def _update_lifting_state(self, height: np.double):
        self.tmp_body_heights.pop(0)
        self.tmp_body_heights.append(height)

    def _playsound_rep(self):
        sound_file = f"./data/audio_src/rep_count/{self.rep_count}.mp3"
        playsound(sound_file, block=False)

    def is_keyframe(self, pose: PoseLandmarksObject, lower_thre=0.96, upper_thre=0.97):
        height = pose.get_2d_height()
        if self.did_touch_top and height < self.initial_body_height * lower_thre:
            self.did_touch_top = False
            return True
        elif not self.did_touch_top and height > self.initial_body_height * upper_thre:
            self.did_touch_top = True
            return False
        else:
            return False

    def reset_rep(self, pose: PoseLandmarksObject):
        self.rep_count: int = 0
        self.is_lifting_up = False
        self.did_touch_bottom = False
        self.did_touch_top = True
        self.initial_body_height = pose.get_2d_height()
        self.tmp_body_heights = [self.initial_body_height] * 10

        self.body_heights_df = pd.DataFrame(index=[], columns=["time", "height", "velocity"])


@dataclass(frozen=True)
class PoseDef:
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
