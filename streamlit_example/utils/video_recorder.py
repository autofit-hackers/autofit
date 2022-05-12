from typing import Union
import os
from pathlib import Path
from typing import Callable

from aiortc.contrib.media import MediaRecorder
import cv2 as cv
import av
from cv2 import VideoWriter


def create_video_writer(fps: int, frame: av.VideoFrame, video_save_path: str) -> cv.VideoWriter:
    """Save video as mp4."""
    assert video_save_path is not None
    assert isinstance(frame, av.VideoFrame)
    os.makedirs(os.path.dirname(video_save_path), exist_ok=True)
    fourcc = cv.VideoWriter_fourcc(*"mp4v")
    video = cv.VideoWriter(video_save_path, fourcc, fps, (frame.width, frame.height))
    print(f"Start saving video to {video_save_path} ...")
    return video


def release_video_writer(video_writer: Union[VideoWriter, None], video_save_path: Union[str, None]) -> None:
    print("Releasing video_writer...")
    video_writer.release()
    video_writer = None
    print(f"Video has saved to {video_save_path}")
