import base64
import io
import os

from PIL import Image

from training_report_render_html import training_report_render_html

# from utils import instruction
from utils.instruction import Instruction, squat_depth, squat_knees_in


def generate_html_report(coaching_contents, html_path):
    html = training_report_render_html(coaching_contents)
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html)


def generate_pdf_report(training_result):
    os.makedirs("training_reports", exist_ok=True)
    generate_html_report(training_result, "training_report.html")
    os.system(f"wkhtmltopdf --enable-local-file-access training_report.html training_report.pdf")
    os.remove("training_report.html")


def generate_data_report():
    # 仮にリストで指定
    # coaching_contents_temp_list = [
    #     "squat_knees_ahead",
    #     "squat_depth",
    #     "squat_feet_width",
    #     "squat_hands_width",
    #     "squat_bar_depth",
    #     "squat_back_shin_parallel",
    #     "squat_heavier",
    #     "squat_knees_in",
    # ]

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
    instruction = Instruction()
    training_result = {"menu": "squat", "weight": 80, "reps": 8, "instructions": instruction}
    # set_score = training_result["instructions"].data["squat_knees_ahead"].set_score
    # text = training_result["instructions"].data["squat_knees_ahead"].info.text
    return training_result


if __name__ == "__main__":
    training_result = generate_data_report()

    generate_pdf_report(training_result)
