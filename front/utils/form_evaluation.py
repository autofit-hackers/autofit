from dataclasses import field
from typing import Dict
from utils.class_objects import RepObject
from utils.instruction import InstructionRule

rules: Dict[str, InstructionRule] = field(
        default_factory=lambda: {
            "squat_knees_in": InstructionRule(
                text="内股やな",
                judge_function=squat_knees_in,
                reason="外転筋が弱いんちゃうか",
                menu_to_recommend=("ヒップアブダクション",),
            ),
            "squat_depth": InstructionRule(
                text="しゃがめてへんで", judge_function=squat_depth, reason="足首固いんちゃうか", menu_to_recommend=("足首ストレッチ",)
            ),
        }
    )

def squat_knees_in(self, rep_obj: RepObject) -> bool:
    if "bottom" in rep_obj.keyframes.keys():
        bottom_frame_num = rep_obj.keyframes["bottom"]
        bottom_pose = rep_obj.poses[bottom_frame_num]
        top_pose = rep_obj.poses[0]
        if bottom_pose.get_hip_position()[1] > top_pose.get_knee_position()[1]:
            return True
    return False


def squat_depth(rep_obj: RepObject) -> bool:
    if "bottom" in rep_obj.keyframes.keys():
        bottom_frame_num = rep_obj.keyframes["bottom"]
        bottom_pose = rep_obj.poses[bottom_frame_num]
        top_pose = rep_obj.poses[0]
        if bottom_pose.get_hip_position()[1] < top_pose.get_knee_position()[1]:
            return True
    return False
