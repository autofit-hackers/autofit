from dataclasses import field
from pathlib import Path
from typing import Dict, Tuple

import cv2
from lib.pose.training_set import SetObject
from utils.class_objects import PoseLandmarksObject
from lib.webrtc_ui.display import convert_ndarray2PIL, set_color
from numpy import ndarray
from PIL import Image, ImageDraw

def squat_knees_in(frame: ndarray, pose: PoseLandmarksObject, set_obj: SetObject):
    first_rep_poses = set_obj.reps[0].poses


def squat_depth(frame: ndarray, current_pose: PoseLandmarksObject, set_obj: SetObject):

    first_rep_top_pose = set_obj.reps[0].get_keyframe_pose("top")
    first_rep_top_left_knee = first_rep_top_pose.landmark[25]
    first_rep_top_right_knee = first_rep_top_pose.landmark[26]
    first_rep_top_knee_y = first_rep_top_pose.get_knee_position()[1]
    current_hip = current_pose.get_hip_position()
    is_standard_cleared = current_hip[1] <= first_rep_top_knee_y

    # 1レップ目topでの両膝を結ぶ直線を描画
    line_color = "red" if is_standard_cleared else "blue"
    cv2.line(
        img=frame,
        pt1=tuple(first_rep_top_right_knee),
        pt2=tuple(first_rep_top_left_knee),
        color=set_color(color_name=line_color, color_space="bgr"),
        thickness=1,
    )

    # 現在のレップでのケツの位置を点で描画
    circle_color = "red" if is_standard_cleared else "blue"
    cv2.circle(
        img=frame,
        center=tuple(current_hip),
        radius=5,
        color=set_color(color_name=circle_color, color_space="bgr"),
        thickness=1,
    )
