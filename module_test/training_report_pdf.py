import os

from PIL import Image
from pathlib import Path
from pdf2image import convert_from_path
from front.core.instruction import Instructions

from training_report_render_html import training_report_render_html


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
    instruction = Instructions()
    training_result = {"menu": "squat", "weight": 80, "reps": 8, "instructions": instruction}
    return training_result


def convert_png_report_from_pdf():
    input_pdf_path = Path("./training_report.pdf")
    training_report_image = convert_from_path(pdf_path=input_pdf_path, dpi=200, fmt="png")
    for repo in training_report_image:
        repo.save("training_report.png")


if __name__ == "__main__":
    training_result = generate_data_report()
    generate_pdf_report(training_result)
    convert_png_report_from_pdf()
