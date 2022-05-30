from pathlib import Path
from re import I
from typing import Any, List, Tuple, Union

import cv2
import numpy as np
from matplotlib import colors
from PIL import Image
from ui_components.video_widget import CircleHoldButton


def text(
    frame,
    text: str,
    position: Tuple[float, float],
    font_size: float,
    color_name: str = "White",
    thickness: int = 1,
):
    """
    put text on the frame

    Args:
        text (str): _description_
        position (Tuple[float]): bottom-left position relative to the frame. Must be (0,0) ~ (1.0, 1.0)
        font_size (float): relative to the frame width. Must be in [0.0, 1.0]
        color (str):
        thickness (int): _description_
    """

    assert (0.0, 0.0) <= position <= (1.0, 1.0), "position must be (0,0) ~ (1.0, 1.0)"

    # Adjust parameters
    frame_width = frame.shape[0]
    frame_height = frame.shape[1]
    org = map(int, (frame_width * position[0], frame_height * position[1]))
    fontScale = font_size * frame_width
    color = set_color(color_name)

    cv2.putText(
        frame,
        text=text,
        org=org,
        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
        fontScale=fontScale,
        color=color,
        thickness=thickness,
        lineType=cv2.LINE_4,
    )


def image(
    frame,
    image: Image.Image,
    position: Tuple[float, float],
    size: Tuple[float, float],
    alpha: float = 1,
    hold_aspect_ratio: bool = False,
):
    """
    put transparent image on the frame

    Args:
        img_path (Union[Path, str]): _description_
        position (Tuple[float]): top-left position relative to the frame. Must be (0.0, 0.0) ~ (1.0, 1.0).
        size (Tuple): image size relative to the frame. Must be (0, 0) ~ (1.0, 1.0).
        alpha (float): transparent alpha. Must be in [0.0, 1.0]
    """

    assert 0.0 <= alpha <= 1.0, "Value of alpha must be in [0.0, 0.1]"
    assert (0.0, 0.0) <= position <= (1.0, 1.0), "position must be (0,0) ~ (1.0, 1.0)"

    # Adjust parameters
    frame_width = frame.shape[1]
    frame_height = frame.shape[0]
    box = (int(frame_width * position[0]), int(frame_height * position[1]))
    org_aspect_ratio = image.height / image.width
    if hold_aspect_ratio:
        size = (int(frame_width * size[0]), int(frame_width * size[0] * org_aspect_ratio))
    else:
        size = (int(frame_width * size[0]), int(frame_height * size[1]))
    alpha = int(255 * alpha)

    # Add alpha channel to image
    image = image.resize(size)
    image.putalpha(alpha)

    # Convert ndarray to pillow.Image
    frame_copy = frame.copy()
    frame_copy = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
    frame_copy = Image.fromarray(frame_copy)

    # Put transparent image on the frame
    frame_copy.putalpha(255)
    frame_copy.paste(image, box=box)

    # Convert pillow.Image to ndarray
    frame_copy = np.array(frame_copy)
    frame = cv2.cvtColor(frame_copy, cv2.COLOR_RGBA2BGR)

    return frame


def button(
    frame,
    button: CircleHoldButton,
    text: str,
    position: Tuple[float, float],
    size: Tuple[float, float],
    color_name_ing: str,
    color_name_ed: str,
):
    color_ing = set_color(color_name_ing)
    color_ed = set_color(color_name_ed)
    button.update(frame, color_ing=color_ing, color_ed=color_ed, text=text)


def set_color(color_name: str, return_gbr: bool = False) -> Tuple[int, int, int]:
    color = colors.to_rgb(color_name)
    if return_gbr:
        color = (int(color[2]), int(color[1]), int(color[0]))
    else:
        color = (int(color[0]), int(color[1]), int(color[2]))

    return color
