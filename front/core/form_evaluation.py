from dataclasses import field
from pathlib import Path
from typing import Dict, Tuple

from PIL import Image
from front.lib.pose.training_set import RepObject


def squat_knees_in(rep_obj: RepObject) -> Tuple[bool, float]:
    if "bottom" in rep_obj.keyframes.keys():
        bottom_frame_num = rep_obj.keyframes["bottom"]
        bottom_pose = rep_obj.poses[bottom_frame_num]
        top_pose = rep_obj.poses[0]
        if bottom_pose.get_hip_position()[1] > top_pose.get_knee_position()[1]:
            return (False, 0.5)
    return (True, 1)


def squat_depth(rep_obj: RepObject) -> Tuple[bool, float]:
    if "bottom" in rep_obj.keyframes.keys():
        bottom_frame_num = rep_obj.keyframes["bottom"]
        bottom_pose = rep_obj.poses[bottom_frame_num]
        top_pose = rep_obj.poses[0]
        if bottom_pose.get_hip_position()[1] < top_pose.get_knee_position()[1]:
            return (False, 0.3)
    return (True, 1)
