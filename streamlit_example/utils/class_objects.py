from dataclasses import dataclass, field
from pathlib import Path
from turtle import update
from typing import List, NamedTuple, Union

import numpy as np
from this import d
from frozendict import frozendict


class PoseLandmarksObject(NamedTuple):
    """
    landmark.shape == (関節数, 3)
    visibility.shape == (関節数, 1)
    """

    landmark: np.ndarray
    visibility: np.ndarray
    timestamp: Union[float, None]
    bone_edge_names = frozendict(
        {
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
    )

    def get_height(self) -> np.double:
        neck = (self.landmark[11] + self.landmark[12]) / 2
        foot_center = (self.landmark[27] + self.landmark[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def get_foot_position(self) -> np.ndarray:
        return (self.landmark[27] + self.landmark[28]) / 2

    def get_keypoint(self, training_name: str) -> np.ndarray:
        if training_name == "squat":
            return (self.landmark[11] + self.landmark[12]) / 2
        else:
            return (self.landmark[11] + self.landmark[12]) / 2

    def get_bone_lengths(self) -> dict:
        bone_dict = {"foot_neck_height": self.get_height()}
        for bone_edge_key in self.bone_edge_names.keys():
            bone_dict[bone_edge_key] = np.linalg.norm(
                self.landmark[self.bone_edge_names[bone_edge_key][0]]
                - self.landmark[self.bone_edge_names[bone_edge_key][1]]
            )
        return bone_dict


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
        reset_button: bool,
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

    def init_rep(self, pose: PoseLandmarksObject):
        self.initial_body_height = pose.get_height()
        self.tmp_body_heights = [self.initial_body_height] * 10

    def update_rep(self, pose: PoseLandmarksObject, lower_thre, upper_thre):
        if self.tmp_body_heights is None:
            self.init_rep(pose=pose)
        self.update_counter(pose=pose, lower_thre=lower_thre, upper_thre=upper_thre)
        self.update_lifting_state(pose=pose)

    def update_counter(self, pose: PoseLandmarksObject, lower_thre, upper_thre):
        height = pose.get_height()
        if height < self.initial_body_height * lower_thre:
            self.did_touch_bottom = True
        elif self.did_touch_bottom and height > self.initial_body_height * upper_thre:
            self.rep_count += 1
            self.did_touch_bottom = False

    def update_lifting_state(self, pose: PoseLandmarksObject):
        self.tmp_body_heights.pop()
        self.tmp_body_heights.append(pose.get_height())

    def is_keyframe(self, pose: PoseLandmarksObject, threshold=0.95):
        if len(self.tmp_body_heights) == 10:
            is_delta_lifting_up = self.tmp_body_heights[9] > self.tmp_body_heights[0]
            if self.is_lifting_up and is_delta_lifting_up and pose.get_height() > self.initial_body_height * threshold:
                return True
            else:
                return False
        else:
            return False
