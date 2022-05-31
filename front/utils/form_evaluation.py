from dataclasses import field
from pathlib import Path
from typing import Dict, Tuple

from PIL import Image

from utils.class_objects import RepObject


def squat_knees_in(rep_obj: RepObject) -> Tuple[bool, float]:
    bottom_pose = rep_obj.get_keyframe_pose(key="bottom")
    top_pose = rep_obj.get_keyframe_pose(key="top")
    if bottom_pose.get_hip_position()[1] > top_pose.get_knee_position()[1]:
        return (False, 0.5)
    return (True, 1)


def squat_depth(rep_obj: RepObject) -> Tuple[bool, float]:
    bottom_pose = rep_obj.get_keyframe_pose(key="bottom")
    top_pose = rep_obj.get_keyframe_pose(key="top")
    if bottom_pose.get_hip_position()[1] < top_pose.get_knee_position()[1]:
        return (False, 0.3)
    return (True, 1)
