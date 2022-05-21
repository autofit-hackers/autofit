import base64
import io
import os

from PIL import Image

from training_report_format_content import training_report_format_content
from training_report_render_html import training_report_render_html


def generate_html():
    pass


def generate_html_report(coaching_contents, html_path):

    # raw_content = {
    #     "created_at": "20220101000000",
    #     "patient_id": "000000",
    #     "which": "L",
    #     "diagnosed_at": "20220401000000",
    #     "interpreter": "読影 太郎",
    #     "scheie": {"H": 1, "S": 1},
    #     "diagnoses": [diagnosis],
    #     "health_grade": "A",
    # }
    # health_grade = raw_content.pop("health_grade")
    # content = training_report_format_content(raw_content)

    html = training_report_render_html(coaching_contents)
    with open(html_path, "w", encoding="utf-8") as html_file:
        html_file.write(html)


if __name__ == "__main__":
    coaching_contents_temp = ["squat_depth"]  # 仮にスクワット時の腰の高さに指導を入れた場合

    os.makedirs("traning_reports", exist_ok=True)
    generate_html_report(coaching_contents_temp, "training_report.html")
    os.system(f"wkhtmltopdf training_report.html traning_report.pdf")
    os.remove("traning_report.html")


# if __name__ == "__main__":
#     filenames = (
#         "./imgs/999_Retina_OS_20200522_163629.jpg",
#         "./imgs/00002238_Retina_OD_20200525_142338.jpg",
#         "./imgs/00135673_Retina_OS_20200618_135907.jpg",
#         "./imgs/00212613_Retina_OS_20200604_133402.jpg",
#         "./imgs/00405175_Retina_OD_20200601_151332.jpg",
#     )

#     diagnoses = (
#         "脈絡膜変性",
#         "糖尿病網膜症",
#         "中心性漿液性網脈絡膜症・黄斑前膜",
#         "網膜細動脈瘤破裂",
#         "緑内障",
#     )

# os.makedirs("reports", exist_ok=True)
# for index, (filename, diagnosis) in enumerate(zip(filenames, diagnoses), 1):
#     generate_html_report(filename, diagnosis, "report.html")
#     os.system(f"wkhtmltopdf report.html reports/report{index}.pdf")
# os.remove("report.html")
