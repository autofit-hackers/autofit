import json
import pickle
from dataclasses import dataclass, field
from pathlib import Path
from turtle import width
from typing import Any, List, Tuple, Union

import cv2
import numpy as np
import pandas as pd
from PIL import Image
from ui_components.video_widget import CircleHoldButton

from utils.calculate_fps import FpsCalculator
from utils.class_objects import PoseLandmarksObject, RepState
from utils.draw_pose import draw_landmarks_pose


class Display:
    def __init__(self, frame: np.ndarray):
        self.frame = frame

    def text(
        self,
        text: str,
        position: Tuple,
        font_size: float,
        color: Tuple,
        thickness: int,
    ):
        cv2.putText(
            self.frame,
            text=text,
            org=position,
            fontFace=cv2.FONT_HERSHEY_SIMPLEX,
            fontScale=font_size,
            color=color,
            thickness=thickness,
            lineType=cv2.LINE_4,
        )

    def image(
        self,
        img_path: Union[Path, str],
        position: Tuple,
        size: Tuple,
        alpha: float,
    ):
        assert 0.0 <= alpha <= 1.0, "Value of alpha has to be in [0.0, 0.1]"

        img_path = Path(img_path)
        image = Image.open(img_path)
        image = image.resize(size)
        image.putalpha(int(255 * alpha))

        # Convert ndarray to pillow.Image
        frame_copy = self.frame.copy()
        frame_copy = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
        frame_copy = Image.fromarray(frame_copy)

        # Add alpha channel to frame
        frame_copy.putalpha(255)
        frame_copy.paste(image, box=position)

        # Convert pillow.Image to ndarray
        frame_copy = np.array(frame_copy)
        frame = cv2.cvtColor(frame_copy, cv2.COLOR_RGBA2BGR)

        return frame

    def button(self, button: CircleHoldButton, color_ing: Tuple, color_ed: Tuple, text: str):
        button.update(self.frame, color_ing=color_ing, color_ed=color_ed, text=text)
