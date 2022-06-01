from dataclasses import dataclass, field
from pathlib import Path
from traceback import print_tb
from typing import Any, Callable, Dict, List, Tuple

import cv2
from lib.pose.training_set import RepObject
from numpy import ndarray
from PIL import Image

import core.form_evaluation as eval
import lib.webrtc_ui.display as disp


@dataclass(frozen=True)
class InstructionRule:
    """Rule of form instruction (immutable)"""

    text: str
    judge_function: Callable
    reason: str
    menu_to_recommend: Tuple[str]
    instruction_image: Image.Image


@dataclass
class InstructionLog:
    """mutable"""

    is_cleared_in_each_rep: List[bool]
    set_score: float


@dataclass
class Instructions:
    """
    Add instance variable if you want to define a new instruction.
    """

    # XXX: hardcode
    rules: Dict[str, InstructionRule] = field(
        default_factory=lambda: {
            "squat_knees_in": InstructionRule(
                text="膝が内に入っています",
                judge_function=eval.squat_knees_in,
                reason="外転筋が弱い",
                menu_to_recommend=("ヒップアブダクション",),
                instruction_image=Image.open(Path("data/instruction/squat_knees_in.png")),
            ),
            "squat_depth": InstructionRule(
                text="しゃがみ込みが浅いです",
                judge_function=eval.squat_depth,
                reason="足首が固い",
                menu_to_recommend=("足首ストレッチ",),
                instruction_image=Image.open(Path("data/instruction/squat_depth.png")),
            ),
            # TODO: form_evaluation.pyで関数が実装されるまでエラーになるのでコメントアウト
            # "squat_knees_ahead": InstructionRule(
            #     text="膝が前に出過ぎています",
            #     judge_function=eval.squat_knees_ahead,
            #     reason="",
            #     menu_to_recommend=("",),
            #     instruction_image=Image.open(Path("data/instruction/squat_knees_ahead.png")),
            # ),
            # "squat_feet_width": InstructionRule(
            #     text="足幅が狭いです",
            #     judge_function=eval.squat_feet_width,
            #     reason="",
            #     menu_to_recommend=("",),
            #     instruction_image=Image.open(Path("data/instruction/squat_feet_width.png")),
            # ),
            # "squat_hands_width": InstructionRule(
            #     text="手幅が狭いです",
            #     judge_function=eval.squat_hands_width,
            #     reason="",
            #     menu_to_recommend=("",),
            #     instruction_image=Image.open(Path("data/instruction/squat_hands_width.png")),
            # ),
            # "squat_bar_depth": InstructionRule(
            #     text="バーが高すぎます",
            #     judge_function=eval.squat_bar_depth,
            #     reason="肩まわりの柔軟性が低い",
            #     menu_to_recommend=("ブランコストレッチ",),
            #     instruction_image=Image.open(Path("data/instruction/squat_bar_depth.png")),
            # ),
            # "squat_back_shin_parallel": InstructionRule(
            #     text="背中とすねが平行になるようにしゃがみましょう",
            #     judge_function=eval.squat_back_shin_parallel,
            #     reason="足首固いんちゃうか",
            #     menu_to_recommend=("足首ストレッチ",),
            #     instruction_image=Image.open(Path("data/instruction/squat_back_shin_parallel.png")),
            # ),
            # "squat_heavier": InstructionRule(
            #     text="バーが重すぎます",
            #     judge_function=eval.squat_heavier,
            #     reason="",
            #     menu_to_recommend=("",),
            #     instruction_image=Image.open(Path("data/instruction/squat_heavier.png")),
            # ),
        }
    )

    logs: Dict[str, InstructionLog] = field(
        default_factory=lambda: {
            "squat_knees_in": InstructionLog([], 0),
            "squat_depth": InstructionLog([], 0),
        }
    )

    instruction_to_show: str = ""

    def evaluate_rep(self, rep_obj: RepObject) -> None:
        """rep_objectを全てのinstruction.judge_functionにかけてis_okにboolを代入

        Args:
            rep_obj (RepObject):
        """

        judge_loss: float = 0.0
        for key, rule in self.rules.items():
            is_cleared, loss = rule.judge_function(rep_obj)
            self.logs[key].is_cleared_in_each_rep.append(is_cleared)

            # update instruction to show, which has the largest loss
            if loss > judge_loss:
                self.instruction_to_show = key
                judge_loss = loss
        print("INSTRUCTION================", self.instruction_to_show)

    def show(self, frame: ndarray) -> ndarray:
        """when self has instructions to show (the trainee made some mistakes in a rep), show corresponding image

        Args:
            frame (ndarray): frame image

        Returns:
            ndarray: frame image with instruction(if nothing to show, returns input frame)
        """
        # if nothing to show, pass
        if self.instruction_to_show == "":
            return frame

        # put instruction img on frame
        return disp.image(
            frame=frame,
            image=self.rules[self.instruction_to_show].instruction_image,
            position=(0.45, 0.05),
            size=(0.5, 0),
            hold_aspect_ratio=True,
        )

    def get_training_result(self):
        return {"menu": "squat", "weight": 80, "reps": 8, "instructions": self.logs}


#######################################################################

# 結果 = {"menu": "squat", "weight": 80, "reps": 8, "instructions": 指導}
