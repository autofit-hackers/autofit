from dataclasses import field
from pathlib import Path
from typing import Dict, Tuple

from PIL import Image

from utils.class_objects import RepObject


def squat_knees_in() -> Tuple[bool, float]:

    return (True, 1)


def squat_depth(rep_obj: RepObject) -> Tuple[bool, float]:

    return (True, 1)
