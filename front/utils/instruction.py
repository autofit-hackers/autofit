from dataclasses import dataclass
import string
from typing import Callable, List

from utils.class_objects import PoseLandmarksObject


@dataclass
class InstructionData:
    name: str
    should_display: bool
    instruction_text: str
    judge_function: Callable
    kwargs: dict
    reason: str
    menu_to_recommend: List[str]


def squat_knees_ahead(poses: List[PoseLandmarksObject], keyframe_idx: dict) -> bool:
    return True


def squat_depth(poses: List[PoseLandmarksObject], keyframe_idx: dict) -> bool:
    return True


class Instructions:
    def update(self, poses: List[PoseLandmarksObject], keyframe_idx: dict):
        for instruction in self.instructions:
            instruction.should_display = instruction.judge_function(poses[keyframe_idx["bottom"]])

    instructions: List[InstructionData] = [
        InstructionData(
            name="squat_knees_ahead",
            should_display=False,
            instruction_text="膝出てんで",
            judge_function=squat_knees_ahead,
            kwargs={},
            reason="ケツ引かんからや",
            menu_to_recommend=[],
        ),
        InstructionData(
            name="squat_depth",
            should_display=False,
            instruction_text="しゃがめてへんで",
            judge_function=squat_depth,
            kwargs={},
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
