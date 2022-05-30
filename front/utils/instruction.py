from dataclasses import dataclass, field
from pathlib import Path
from traceback import print_tb
from typing import Any, Callable, Dict, List, Tuple

import cv2
from numpy import ndarray
from PIL import Image

import utils.form_evaluation as eval
from utils.class_objects import PoseLandmarksObject, RepObject
import utils.display as disp


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

    rules: Dict[str, InstructionRule] = field(
        default_factory=lambda: {
            "squat_knees_in": InstructionRule(
                text="内股やな",
                judge_function=eval.squat_knees_in,
                reason="外転筋が弱いんちゃうか",
                menu_to_recommend=("ヒップアブダクション",),
                instruction_image=Image.open(Path("data/instruction/squat_knees_in.png")),
            ),
            "squat_depth": InstructionRule(
                text="しゃがめてへんで",
                judge_function=eval.squat_depth,
                reason="足首固いんちゃうか",
                menu_to_recommend=("足首ストレッチ",),
                instruction_image=Image.open(Path("data/instruction/squat_depth.png")),
            ),
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
            rep_obj (RepObject): _description_
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

    def show(self, frame: ndarray):
        """frameに指導画像を描画する関数

        Args:
            frame (ndarray): フレームだよ
        """
        # if nothing to show, pass
        if self.instruction_to_show == "":
            return frame

        print("DISPLAYING", self.rules[self.instruction_to_show].instruction_image)
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
