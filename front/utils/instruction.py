from dataclasses import dataclass
import string
from typing import Callable, List

from utils.class_objects import PoseLandmarksObject, RepObject


@dataclass
class InstructionData:
    name: str
    should_display: bool
    instruction_text: str
    judge_function: Callable
    reason: str
    menu_to_recommend: List[str]


def squat_knees_in(rep_obj: RepObject) -> bool:
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
        if bottom_pose.get_hip_position()[1] > top_pose.get_knee_position()[1]:
            return True
    return False

class Instructions:
    def update(self, rep_obj: RepObject):
        for instruction in self.instructions:
            instruction.should_display = instruction.judge_function(rep_obj)

    instructions: List[InstructionData] = [
        InstructionData(
            name="squat_knees_in",
            should_display=False,
            instruction_text="内股やな",
            judge_function=squat_knees_in,
            reason="外転筋が弱いんちゃうか",
            menu_to_recommend=["ヒップアブダクション"],
        ),
        InstructionData(
            name="squat_depth",
            should_display=False,
            instruction_text="しゃがめてへんで",
            judge_function=squat_depth,
            reason="足首固いんちゃうか",
            menu_to_recommend=["足首ストレッチ"],
        ),
    ]

    # instruction_dict = {
    #     "squat_knees_ahead": InstructionData(
    #         should_display=False,
    #         instruction_text="膝出てんで",
    #         judge_function=squat_knees_ahead,
    #         kwargs={},
    #         reason="ケツ引かんからや",
    #         menu_to_recommend=[],
    #     ),
    #     "squat_depth": InstructionData(
    #         should_display=False,
    #         instruction_text="しゃがめてへんで",
    #         judge_function=squat_depth,
    #         kwargs={},
    #         reason="足首固いんちゃうか",
    #         menu_to_recommend=["足首ストレッチ"],
    #     ),
    # }


# training_result = {
#     "menu": "squat",
#     "weight": 80,
#     "reps": 8,
#     "instructions": [
#         InstructionData(
#             name="squat_knees_ahead",
#             should_display=False,
#             instruction_text="膝出てんで",
#             judge_function=squat_knees_ahead,
#             kwargs={},
#             reason="ケツ引かんからや",
#             menu_to_recommend=[],
#         ),
#         InstructionData(
#             name="squat_depth",
#             should_display=False,
#             instruction_text="しゃがめてへんで",
#             judge_function=squat_depth,
#             kwargs={},
#             reason="足首固いんちゃうか",
#             menu_to_recommend=["足首ストレッチ"],
#         ),
#     ],
# }
