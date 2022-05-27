from pathlib import Path
from typing import Any, List, Tuple, Union

import cv2
import numpy as np
from PIL import Image
from ui_components.video_widget import CircleHoldButton


class Display:
    def __init__(self, frame: np.ndarray):
        self.frame = frame

    def text(
        self,
        text: str,
        position: Tuple[float, float],
        font_size: float,
        color: Tuple[int, int, int] = (255, 255, 255),
        thickness: int = 1,
    ):
        """
        put text on the frame

        Args:
            text (str): _description_
            position (Tuple[float]): bottom-left position relative to the frame. Must be (0,0) ~ (1.0, 1.0)
            font_size (float): relative to the frame width. Must be in [0.0, 1.0]
            color (Tuple): _description_
            thickness (int): _description_
        """

        assert (0.0, 0.0) <= position <= (1.0, 1.0), "position must be (0,0) ~ (1.0, 1.0)"

        # Adjust parameters
        frame_width = self.frame[0]
        frame_height = self.frame[1]
        org = map(int, (frame_width * position[0], frame_height * position[1]))
        fontScale = font_size * frame_width

        cv2.putText(
            self.frame,
            text=text,
            org=org,
            fontFace=cv2.FONT_HERSHEY_SIMPLEX,
            fontScale=fontScale,
            color=color,
            thickness=thickness,
            lineType=cv2.LINE_4,
        )

    def image(
        self,
        image: Image.Image,
        position: Tuple[float, float],
        size: Tuple[float, float],
        alpha: float = 1,
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
        frame_width = self.frame[0]
        frame_height = self.frame[1]
        box = (frame_width * position[0], frame_height * position[1])
        size = (frame_width * size[0], frame_height * size[1])
        alpha = int(255 * alpha)

        # Add alpha channel to image
        image = image.resize(size)
        image.putalpha(alpha)

        # Convert ndarray to pillow.Image
        frame_copy = self.frame.copy()
        frame_copy = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
        frame_copy = Image.fromarray(frame_copy)

        # Put transparent image on the frame
        frame_copy.putalpha(255)
        frame_copy.paste(image, box=box)

        # Convert pillow.Image to ndarray
        frame_copy = np.array(frame_copy)
        frame = cv2.cvtColor(frame_copy, cv2.COLOR_RGBA2BGR)

        self.frame = frame

    def button(
        self,
        button: CircleHoldButton,
        text: str,
        position: Tuple[float, float],
        size: Tuple[float, float],
        color_ing: Tuple[int, int, int] = (255, 255, 0),
        color_ed: Tuple[int, int, int] = (0, 255, 255),
    ):

        button.update(self.frame, color_ing=color_ing, color_ed=color_ed, text=text)
