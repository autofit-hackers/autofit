from dataclasses import field
from pathlib import Path
from typing import Dict, Tuple

import cv2
from lib.pose.training_set import SetObject
from lib.webrtc_ui.display import convert_ndarray2PIL, restore_landmark_in_frame_scale, set_color
from numpy import ndarray
from PIL import Image, ImageDraw

from utils.class_objects import PoseLandmarksObject


def squat_knees_in(frame: ndarray, curret_pose: PoseLandmarksObject, set_obj: SetObject):
    first_rep_poses = set_obj.reps[0].poses


def squat_depth(frame: ndarray, current_pose: PoseLandmarksObject, set_obj: SetObject):

    first_rep_top_pose = set_obj.reps[0].get_keyframe_pose("top")
    first_rep_top_left_knee = restore_landmark_in_frame_scale(first_rep_top_pose.landmark[25][:2], frame)
    first_rep_top_right_knee = restore_landmark_in_frame_scale(first_rep_top_pose.landmark[26][:2], frame)
    first_rep_top_knee_y = first_rep_top_pose.get_knee_position()[1]
    current_left_hip = restore_landmark_in_frame_scale(current_pose.landmark[23][:2], frame)
    current_right_hip = restore_landmark_in_frame_scale(current_pose.landmark[24][:2], frame)
    current_hip_y = current_pose.get_hip_position()[1]
    is_standard_cleared = current_hip_y <= first_rep_top_knee_y

    # 1レップ目topでの両膝を結ぶ直線を描画
    line_color = "red" if is_standard_cleared else "blue"
    cv2.line(
        img=frame,
        pt1=(int(first_rep_top_right_knee[0]), int(first_rep_top_right_knee[1])),
        pt2=(int(first_rep_top_left_knee[0]), int(first_rep_top_left_knee[1])),
        color=set_color(color_name=line_color, color_space="bgr"),
        thickness=1,
    )

    # 現在のレップでのケツの位置を点で描画
    circle_color = "red" if is_standard_cleared else "blue"
    cv2.line(
        img=frame,
        pt1=(int(current_right_hip[0]), int(current_right_hip[1])),
        pt2=(int(current_left_hip[0]), int(current_left_hip[1])),
        color=set_color(color_name=line_color, color_space="bgr"),
        thickness=1,
    )
