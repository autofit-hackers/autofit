import base64
import io
import os

from PIL import Image

from training_report_render_html import training_report_render_html
from utils.instruction import InstructionData, squat_depth, squat_knees_in


def generate_html_report(coaching_contents, html_path):
    html = training_report_render_html(coaching_contents)
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html)


if __name__ == "__main__":

    # 仮の実装として，ここで指定
    # squat_knees_ahead:膝のラインが前
    # squat_depth:腰の高さが高い
    # squat_feet_width:足の幅が異なる
    # squat_hands_width:手の幅が異なる
    # squat_bar_depth:バーの位置が異なる
    # squat_back_shin_parallel:背中と脛が平行に
    # squat_heavier:バーを重く
    # squat_knees_in:膝が中に入ってしまっている
    coaching_contents_temp_list = [
        "squat_knees_ahead",
        "squat_depth",
        "squat_feet_width",
        "squat_hands_width",
        "squat_bar_depth",
        "squat_back_shin_parallel",
        "squat_heavier",
        "squat_knees_in",
    ]  # 仮にリストで指定

    coaching_contents_temp = {
        "menu_name": "スクワット",
        "reps": 3,
        "good_point": "腰が十分に下がっている",
        "one_point": "もう少し軽くしましょう",
        "recommended_menus": [
            {
                "bad_point": "手の幅がおかしい",
                "proposed_menu": "ブランコストレッチ",
            }
        ],
    }  # 仮に辞書で指定

    training_result = {
        "menu": "squat",
        "weight": 80,
        "reps": 8,
        "instructions": [
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
        ],
    }

    reason_0 = training_result["instructions"][0].reason

    os.makedirs("traning_reports", exist_ok=True)
    generate_html_report(coaching_contents_temp, "training_report.html")
    os.system(f"wkhtmltopdf training_report.html traning_report.pdf")
    os.remove("training_report.html")
