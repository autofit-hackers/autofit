from pathlib import Path
import string
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Tuple

import cv2

from numpy import ndarray

from utils.class_objects import PoseLandmarksObject, RepObject
import utils.form_evaluation as eval


@dataclass(frozen=True)
class InstructionInfo:
    text: str
    judge_function: Callable
    reason: str
    menu_to_recommend: List[str]
    # ここ、APIリクエストを受け取って格納するイメージがまだ湧いてない（遠藤）
    # こんちゃん相談案件


@dataclass
class InstructionItem:
    info: InstructionInfo
    is_cleared_in_each_rep: List[bool]
    set_score: float


@dataclass
class Instruction:
    """
    Add instance variable if you want to define a new instruction.
    """

    data: Dict[str, InstructionItem] = field(
        default_factory=lambda: {
            "squat_knees_in": InstructionItem(
                info=InstructionInfo(
                    text="内股やな", judge_function=eval.squat_knees_in, reason="外転筋が弱いんちゃうか", menu_to_recommend=["ヒップアブダクション"]
                ),
                is_cleared_in_each_rep=[],
                set_score=0,
            ),
            "squat_depth": InstructionItem(
                info=InstructionInfo(
                    text="しゃがめてへんで", judge_function=eval.squat_depth, reason="足首固いんちゃうか", menu_to_recommend=["足首ストレッチ"]
                ),
                is_cleared_in_each_rep=[],
                set_score=0,
            ),
        }
    )

    def evaluate_rep(self, rep_obj: RepObject):
        """rep_objectを全てのinstruction.judge_functionにかけてis_okにboolを代入

        Args:
            rep_obj (RepObject): _description_
        """
        for name, instruction_item in self.data.items():
            instruction_item.is_cleared_in_each_rep.append(instruction_item.info.judge_function(rep_obj))

    def show(self, frame: ndarray) -> None:
        """frameに指導画像を描画する関数

        Args:
            frame (ndarray): フレームだよ
        """
        for name, instruction_item in self.data.items():
            instruction_image_path = Path(f"data/instruction/{name}.png")
            instruction_image = cv2.imread(str(instruction_image_path))
            print(instruction_image_path)

    def get_training_result(self):
        return {"menu": "squat", "weight": 80, "reps": 8, "instructions": self.data}


#######################################################################

# 結果 = {"menu": "squat", "weight": 80, "reps": 8, "instructions": 指導}
