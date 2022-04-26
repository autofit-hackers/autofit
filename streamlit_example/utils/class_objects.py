from typing import List, NamedTuple, Union
import numpy as np


# def Fake
#     picklable_results = PoseLandmarkObject(
#         landmark=np.array(
#             [
#                 [pose_landmark.x, pose_landmark.y, pose_landmark.z]
#                 for pose_landmark in results.pose_landmarks.landmark
#             ]
#         ),
#         visibility=np.array([pose_landmark.visibility for pose_landmark in results.pose_landmarks.landmark]),
#     )


class FakeLandmarkObject(NamedTuple):
    x: float
    y: float
    z: float
    visibility: bool


class FakeLandmarksObject(NamedTuple):
    landmark: List[FakeLandmarkObject]


class FakeResultObject(NamedTuple):
    pose_landmarks: FakeLandmarksObject


class PoseLandmarkObject(NamedTuple):
    """
    landmark.shape == (関節数, 3)
    visibility.shape == (関節数, 1)
    """

    landmark: np.ndarray
    visibility: np.ndarray


class PoseLandmarksObject(NamedTuple):
    """ """

    landmark: List[PoseLandmarkObject]


class ModelSettings:
    def __init__(
        self,
        model_complexity,
        min_detection_confidence,
        min_tracking_confidence,
    ):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class DisplaySetting:
    def __init__(
        self,
        rev_color: bool,
        rotate_webcam_input: bool,
        show_fps: bool,
        show_2d: bool,
        count_rep: bool,
    ):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class SaveSettings:
    def __init__(
        self,
        video_save_path: Union[str, None] = None,
        pose_save_path: Union[str, None] = None,
        skelton_save_path: Union[str, None] = None,
    ):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class UploadSettings:
    def __init__(self, uploaded_pose):
        for variable_name, value in locals().items():
            if not variable_name == "self":
                self.__dict__[variable_name] = value


class OperationStates:
    def __init__(
        self,
        reload_pose: bool,
        capture_skelton: bool,
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
