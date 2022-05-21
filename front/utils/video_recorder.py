from typing import List, Union
import os
from pathlib import Path
from typing import Callable

from aiortc.contrib.media import MediaRecorder
import cv2 as cv
import av
from cv2 import VideoWriter
import numpy as np
from utils.class_objects import PoseLandmarksObject
from utils.webcam_input import save_pose


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


class TrainingSaver:
    def __init__(self) -> None:
        self.pose_save_path: Union[str, None] = None
        self.pose_memory: List[PoseLandmarksObject] = []
        self.video_save_path: Union[str, None] = None
        self.video_writer: Union[cv.VideoWriter, None] = None

    def update(self, pose, frame, timestamp):
        # video_writerが存在しない場合、初期化
        if self.video_writer is None:
            self._initialize_video_writer(frame=frame)

        # 保存用配列にポーズの追加
        self.pose_memory.append(
            pose
            if pose
            else PoseLandmarksObject(
                landmark=np.zeros(shape=(33, 3)), visibility=np.zeros(shape=(33, 1)), timestamp=timestamp
            )
        )
        # 動画のフレームをvideo_writerに追加
        assert self.video_writer is not None
        self.video_writer.write(frame)

    def _initialize_video_writer(self, frame: av.VideoFrame):
        frame_to_save = av.VideoFrame.from_ndarray(frame, format="rgb24")
        assert self.video_save_path is not None
        self.video_writer = create_video_writer(fps=30, frame=frame_to_save, video_save_path=self.video_save_path)
        print(f"initialized video writer to save {self.video_save_path}")

    def save(self):
        # pose の保存（書き出し）
        save_pose(pose_save_path=self.pose_save_path, pose_memory=self.pose_memory)
        self.pose_memory = []
        # 動画の保存（writerの解放）
        release_video_writer(video_writer=self.video_writer, video_save_path=self.video_save_path)
