import base64
import io
import os

from PIL import Image

from training_report_render_html import training_report_render_html

# from utils import instruction
from utils.instruction import Instruction, InstructionInfo, InstructionItem, squat_depth, squat_knees_in


def generate_html_report(coaching_contents, html_path):
    html = training_report_render_html(coaching_contents)
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html)


if __name__ == "__main__":

    # # 仮の実装として，ここで指定
    # # squat_knees_ahead:膝のラインが前
    # # squat_depth:腰の高さが高い
    # # squat_feet_width:足の幅が異なる
    # # squat_hands_width:手の幅が異なる
    # # squat_bar_depth:バーの位置が異なる
    # # squat_back_shin_parallel:背中と脛が平行に
    # # squat_heavier:バーを重く
    # # squat_knees_in:膝が中に入ってしまっている
    # coaching_contents_temp_list = [
    #     "squat_knees_ahead",
    #     "squat_depth",
    #     "squat_feet_width",
    #     "squat_hands_width",
    #     "squat_bar_depth",
    #     "squat_back_shin_parallel",
    #     "squat_heavier",
    #     "squat_knees_in",
    # ]  # 仮にリストで指定

    # 仮にクラスで指定
    # training_result = {
    #     "menu": "squat",
    #     "weight": 80,
    #     "reps": 8,
    #     "instructions": [
    #         InstructionData(
    #             name="squat_knees_ahead",
    #             is_ok=True,
    #             instruction_text="膝出てんで",
    #             judge_function=squat_knees_in,
    #             reason="ケツ引かんからや",
    #             menu_to_recommend=[],
    #         ),
    #         InstructionData(
    #             name="squat_depth",
    #             is_ok=False,
    #             instruction_text="しゃがめてへんで",
    #             judge_function=squat_depth,
    #             reason="足首固いんちゃうか",
    #             menu_to_recommend=["足首ストレッチ", "手首ストレッチ"],
    #             # menu_to_recommend=[],
    #         ),
    #     ],
    # }

    # training_result = {
    #     "menu": "squat",
    #     "weight": 80,
    #     "reps": 8,
    #     "instructions": [{
    #         name="squat_knees_ahead",
    #         is_ok=True,
    #         instruction_text="膝出てんで",
    #         judge_function=squat_knees_in,
    #         reason="ケツ引かんからや",
    #         menu_to_recommend=[],
    #         },
    #         {
    #         name="squat_depth",
    #         is_ok=False,
    #         instruction_text="しゃがめてへんで",
    #         judge_function=squat_depth,
    #         reason="足首固いんちゃうか",
    #         menu_to_recommend=["足首ストレッチ", "手首ストレッチ"],
    #         # menu_to_recommend=[],
    #         }]
    # }

    instruction = Instruction()

    training_result = {"menu": "squat", "weight": 80, "reps": 8, "instructions": instruction}

    # set_score = training_result["instructions"].data["squat_knees_ahead"].set_score
    # text = training_result["instructions"].data["squat_knees_ahead"].info.text
    # set_score = training_result["aaa"]
    # set_score = training_result.aaa

    os.makedirs("training_reports", exist_ok=True)
    generate_html_report(training_result, "training_report.html")
    os.system(f"wkhtmltopdf --enable-local-file-access training_report.html training_report.pdf")
    os.remove("training_report.html")
