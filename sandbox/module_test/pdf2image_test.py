from pathlib import Path

import pdf2image

input_pdf_path = Path("test.pdf")
image_dir = Path("out_image")
out_format = "jpeg"

images = pdf2image.convert_from_path(pdf_path=input_pdf_path, dpi=300, fmt=out_format)

for i, image in enumerate(images):
    out_image_path = image_dir / Path("img_{}_{}.{}".format(input_pdf_path.stem, i + 1, out_format))
    image.save(out_image_path, out_format)
