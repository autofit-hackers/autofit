import json
from pathlib import Path
from typing import List, NamedTuple, Union

import numpy as np
import streamlit as st


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

    def get_knees_distance(self) -> np.ndarray:
        return abs(self.landmark[25] - self.landmark[26])

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
        for bone_edge_key in bone_edge_names.keys():
            bone_dict[bone_edge_key] = np.linalg.norm(
                self.landmark[bone_edge_names[bone_edge_key][0]]
                - self.landmark[bone_edge_names[bone_edge_key][1]]
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
