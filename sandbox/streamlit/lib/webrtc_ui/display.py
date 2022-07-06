from typing import Tuple

import cv2
import numpy as np
from lib.webrtc_ui.video_widget import CircleHoldButton
from matplotlib import colors
from PIL import Image


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
    frame_width = frame.shape[1]
    frame_height = frame.shape[0]
    org = (int(frame_width * position[0]), int(frame_height * position[1]))
    color = set_color(color_name)

    cv2.putText(
        frame,
        text=text,
        org=org,
        fontFace=cv2.FONT_HERSHEY_SIMPLEX,
        fontScale=font_size,
        color=color,
        thickness=thickness,
        lineType=cv2.LINE_4,
    )


def image_cv2(
    frame,
    image: np.ndarray,
    normalized_position: Tuple[float, float],
    normalized_size: Tuple[float, float],
    alpha: float = 1,
    hold_aspect_ratio: bool = True,
):
    """
    put transparent image on the frame with cv2

    Args:
        image (np.ndarray): cv2 image to be put on the frame
        normalized_position (Tuple[float]): top-left position relative to the frame. Must be (0.0, 0.0) ~ (1.0, 1.0).
        size (Tuple): image size relative to the frame. Must be (0, 0) ~ (1.0, 1.0).
        alpha (float): transparent alpha. Must be in [0.0, 1.0]
        hold_aspect_ratio  (bool): whether to retain the image aspect ratio
    """
    assert 0.0 <= alpha <= 1.0, "Value of alpha must be in [0.0, 0.1]"
    assert (0.0, 0.0) <= normalized_position <= (1.0, 1.0), "position must be (0,0) ~ (1.0, 1.0)"

    # Adjust parameters
    frame_width = frame.shape[1]
    frame_height = frame.shape[0]
    image_width = image.shape[1]
    image_height = image.shape[0]
    position = (int(frame_width * normalized_position[0]), int(frame_height * normalized_position[1]))
    # org_aspect_ratio = image.shape[0] / image.shape[1]
    org_aspect_ratio = image_height / image_width
    if hold_aspect_ratio:
        size = (
            int(frame_width * normalized_size[0]),
            int(frame_width * normalized_size[0] * org_aspect_ratio),
        )
    else:
        size = (int(frame_width * normalized_size[0]), int(frame_height * normalized_size[1]))

    image = image.copy()
    image[:, :, 3] = image[:, :, 3] * alpha
    image = cv2.resize(image, size)

    x1, y1, x2, y2 = position[0], position[1], position[0] + image.shape[1], position[1] + image.shape[0]
    frame[y1:y2, x1:x2] = frame[y1:y2, x1:x2] * (1 - image[:, :, 3:] / 255) + image[:, :, :3] * (image[:, :, 3:] / 255)

    return frame


def image_pil(
    frame,
    image: Image.Image,
    normalized_position: Tuple[float, float],
    normalized_size: Tuple[float, float],
    alpha: float = 1,
    hold_aspect_ratio: bool = False,
):
    """
    put transparent image on the frame with pillow

    Args:
        image (Image.Image)): pillow image to be put on the frame
        normalized_position (Tuple[float]): top-left position relative to the frame. Must be (0.0, 0.0) ~ (1.0, 1.0).
        size (Tuple): image size relative to the frame. Must be (0, 0) ~ (1.0, 1.0).
        alpha (float): transparent alpha. Must be in [0.0, 1.0]
        hold_aspect_ratio  (bool): whether to retain the image aspect ratio
    """

    assert 0.0 <= alpha <= 1.0, "Value of alpha must be in [0.0, 0.1]"
    assert (0.0, 0.0) <= normalized_position <= (1.0, 1.0), "position must be (0,0) ~ (1.0, 1.0)"

    # Adjust parameters
    frame_width = frame.shape[1]
    frame_height = frame.shape[0]
    position = (int(frame_width * normalized_position[0]), int(frame_height * normalized_position[1]))
    org_aspect_ratio = image.height / image.width
    if hold_aspect_ratio:
        size = (
            int(frame_width * normalized_size[0]),
            int(frame_width * normalized_size[0] * org_aspect_ratio),
        )
    else:
        size = (int(frame_width * normalized_size[0]), int(frame_height * normalized_size[1]))
    alpha = int(255 * alpha)

    # Add alpha channel to image
    image = image.resize(size)
    image.putalpha(alpha)

    frame_copy = convert_ndarray2PIL(frame)

    # Put transparent image on the frame
    frame_copy.putalpha(255)
    frame_copy.paste(image, box=position)

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


def set_color(color_name: str, color_space: str = "bgr") -> Tuple[int, int, int]:
    assert color_space is "rgb" or "bgr", "Invalid color space."

    color = colors.to_rgb(color_name)
    if color_space == "rgb":
        color = (int(color[0] * 255), int(color[1] * 255), int(color[2] * 255))
    elif color_space == "bgr":
        color = (int(color[2] * 255), int(color[1] * 255), int(color[0] * 255))
    else:
        color = (0, 0, 0)

    return color


def convert_ndarray2PIL(image: np.ndarray) -> Image.Image:
    image_copy = image.copy()
    image_copy = cv2.cvtColor(image_copy, cv2.COLOR_BGR2RGB)
    image_copy = Image.fromarray(image_copy)
    return image_copy


def restore_landmark_in_frame_scale(landmark: np.ndarray, frame) -> np.ndarray:
    assert landmark.size == 2, f"landmark must be xy. landmark.shape is now {landmark.shape}"
    image_width, image_height = frame.shape[1], frame.shape[0]
    return landmark[:2] * [image_width, image_height]
