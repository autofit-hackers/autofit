from dataclasses import dataclass
import string
from typing import Callable, List
from numpy import ndarray


from utils.class_objects import PoseLandmarksObject, RepObject


@dataclass
class InstructionData:
    name: str
    is_ok: bool
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


class Instruction_Object:
    instructions: List[InstructionData] = [
        InstructionData(
            name="squat_knees_in",
            is_ok=True,
            instruction_text="内股やな",
            judge_function=squat_knees_in,
            reason="外転筋が弱いんちゃうか",
            menu_to_recommend=["ヒップアブダクション"],
        ),
        InstructionData(
            name="squat_depth",
            is_ok=True,
            instruction_text="しゃがめてへんで",
            judge_function=squat_depth,
            reason="足首固いんちゃうか",
            menu_to_recommend=["足首ストレッチ"],
        ),
    ]

    def execute(self, rep_obj: RepObject):
        for instruction in self.instructions:
            instruction.is_ok = instruction.judge_function(rep_obj)

    def show(self, frame: ndarray) -> None:
        """frameに指導画像を描画する関数

        Args:
            frame (ndarray): フレームだよ
        """
        # TODO: 上野！たすけて！！
        for instruction in self.instructions:
            if instruction.is_ok == False:
                # 描画する
                print(instruction.instruction_text)


#######################################################################
指導 = [
    InstructionData(
        name="squat_knees_ahead",
        is_ok=False,
        instruction_text="膝出てんで",
        judge_function=squat_knees_in,
        reason="ケツ引かんからや",
        menu_to_recommend=[],
    ),
    InstructionData(
        name="squat_depth",
        is_ok=False,
        instruction_text="しゃがめてへんで",
        judge_function=squat_depth,
        reason="足首固いんちゃうか",
        menu_to_recommend=["足首ストレッチ"],
    ),
]

結果 = {"menu": "squat", "weight": 80, "reps": 8, "instructions": 指導}
