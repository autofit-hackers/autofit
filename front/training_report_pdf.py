import os
import imgkit
import io

from PIL import Image
from pathlib import Path
from pdf2image import convert_from_path

from training_report_render_html import training_report_render_html
from utils.instruction import Instructions


#htmlファイルをディレクトリに保存する
def generate_html_report(coaching_contents, training_report_template_path, html_path):
    html = training_report_render_html(coaching_contents, training_report_template_path)
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html)


#pdfファイルをディレクトリに保存する
def generate_pdf_report(training_result, template_jinja):
    os.makedirs("training_reports", exist_ok=True)
    generate_html_report(training_result, template_jinja, "training_report.html")
    # TODO: training_report.pdf以外の名前も作成できるようにする
    os.system(f"wkhtmltopdf --enable-local-file-access training_report.html training_report.pdf")
    os.remove("training_report.html")


#pngファイルを変数に保存する
def generate_png_report(training_result, training_report_template_path):
    os.makedirs("training_reports", exist_ok=True)
    generate_html_report(training_result, training_report_template_path, "training_report.html")
    # TODO: training_report.png以外の名前も作成できるようにする
    training_report_png = imgkit.from_file("training_report.html", False, {"enable-local-file-access": None})
    os.remove("training_report.html")
    return training_report_png


def generate_data_report():
    # training_resultを勝手に決定する
    # TODO: Instructionなどからtraining_resultを生成可能にする
    # instruction = Instructions()
    # training_result = {"menu": "squat", "weight": 80, "reps": 8, "instructions": instruction}
    training_result = {
        "menu": "squat",
        "weight": 80,
        "reps": 8,
        "good_points": [
            {
                "text": "内股やな",
                "judge_function": 6,
                "reason": "外転筋が弱いんちゃうか",
                "menu_to_recommend": ["ヒップアブダクション"],
            },
            {
                "text": "しゃがめてへんで",
                "judge_function": 4,
                "reason": "足首固いんちゃうか",
                "menu_to_recommend": ["足首ストレッチ"],
            },
        ],
        "bad_points": [
            {
                "text": "内股やな",
                "judge_function": 6,
                "reason": "外転筋が弱いんちゃうか",
                "menu_to_recommend": ["ヒップアブダクション"],
            },
            {
                "text": "しゃがめてへんで",
                "judge_function": 4,
                "reason": "足首固いんちゃうか",
                "menu_to_recommend": ["足首ストレッチ"],
            },
        ],
    }

    return training_result


def convert_png_report_from_pdf(training_report_path):
    input_pdf_path = Path(training_report_path)
    training_report_image = convert_from_path(pdf_path=input_pdf_path, dpi=200, fmt="png")
    for repo in training_report_image:
        repo.save("training_report.png")


if __name__ == "__main__":
    # training_result = generate_data_report()

    # path_display = Path("/template/training_report_display.jinja")
    # generate_pdf_report(training_result, str("/template/training_report_display.jinja"))
    # path_distribution = Path("/template/training_report_distribution.jinja")
    # generate_pdf_report(training_result, str(path_distribution))

    # path_training_report_pdf = Path("./training_report.pdf")
    # convert_png_report_from_pdf(path_training_report_pdf)

    # template_path = Path("/template/training_report_display.jinja")
    # generate_png_report(training_result, str(template_path))
    # generate_png_report(training_result, "/template/training_report_display.jinja")


    training_result = generate_data_report()
    template_report_path = Path("/template/training_report_display.jinja")
    training_result_display_png = generate_png_report(training_result, str(template_report_path))
    training_result_display_png_ = Image.open(io.BytesIO(training_result_display_png))
    print(type(training_result_display_png))
    print(type(training_result_display_png_))

    # # bs = training_result_display_png.tobytes()  # 画像をバイト列に変換する
    # dst_im = Image.frombytes('RGBA', training_result_display_png)  # バイト列から画像を生成
    # dst_im.save('test.png')  # 画像を保存