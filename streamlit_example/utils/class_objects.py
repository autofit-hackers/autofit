from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, NamedTuple, Tuple, Union

import cv2 as cv
import numpy as np


class PoseLandmarksObject(NamedTuple):
    """
    landmark.shape == (関節数, 3)
    visibility.shape == (関節数, 1)
    """

    landmark: np.ndarray
    visibility: np.ndarray
    timestamp: Union[float, None]

    def get_height(self):
        neck = (self.landmark[11] + self.landmark[12]) / 2
        foot_center = (self.landmark[27] + self.landmark[28]) / 2
        return np.linalg.norm(neck - foot_center)

    def get_foot_position(self):
        return (self.landmark[27] + self.landmark[28]) / 2


@dataclass
class SessionInfo:
    session_dir_path: str
    camera_dir_path: str
    created_at: str
    user_name: str


@dataclass
class CameraInfo:
    camera_dir_path: str
    camera_names: Dict[str, str]
    created_at: str
    used_in: List[str]
    calibration_rmse: Dict[str, float] = field(default_factory=dict)


@dataclass
class CalibrationSettings:
    board_shape: Tuple[int, int]
    square_size: float
    criteria = (
        cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER,
        30,
        0.001,
    )  # Change this if the code can't find the checkerboard


@dataclass
class CameraStates:
    position: str
    name: str
    rmse: float = 0
    matrix: np.ndarray = np.zeros((3, 3))
    distortion_coeffs: np.ndarray = np.zeros((1, 5))
    rotation: np.ndarray = np.zeros((3, 3))
    trans: np.ndarray = np.zeros((3, 1))


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


@dataclass(frozen=False)
class SaveStates:
    is_saving_video: bool = False
    is_saving_pose: bool = False


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
