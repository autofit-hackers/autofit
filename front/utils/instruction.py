from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Tuple

import cv2
from numpy import ndarray

import utils.form_evaluation as eval
from utils.class_objects import PoseLandmarksObject, RepObject


@dataclass(frozen=True)
class InstructionRule:
    """Rule of form instruction (immutable)"""

    text: str
    judge_function: Callable
    reason: str
    menu_to_recommend: Tuple[str]


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
            ),
            "squat_depth": InstructionRule(
                text="しゃがめてへんで", judge_function=eval.squat_depth, reason="足首固いんちゃうか", menu_to_recommend=("足首ストレッチ",)
            ),
        }
    )

    logs: Dict[str, InstructionLog] = field(
        default_factory=lambda: {
            "squat_knees_in": InstructionLog([], 0),
            "squat_depth": InstructionLog([], 0),
        }
    )

    def evaluate_rep(self, rep_obj: RepObject):
        """rep_objectを全てのinstruction.judge_functionにかけてis_okにboolを代入

        Args:
            rep_obj (RepObject): _description_
        """

        for log, rule in zip(self.logs.values(), self.rules.values()):
            log.is_cleared_in_each_rep.append(rule.judge_function(rep_obj))

    def show(self, frame: ndarray) -> None:
        """frameに指導画像を描画する関数

        Args:
            frame (ndarray): フレームだよ
        """
        for name in self.logs.keys():
            instruction_image_path = Path(f"data/instruction/{name}.png")
            instruction_image = cv2.imread(str(instruction_image_path))
            print(instruction_image_path)

    def get_training_result(self):
        return {"menu": "squat", "weight": 80, "reps": 8, "instructions": self.logs}


#######################################################################

# 結果 = {"menu": "squat", "weight": 80, "reps": 8, "instructions": 指導}
