from typing import List, Union
import os
from pathlib import Path

import cv2
import av
from cv2 import VideoWriter
from utils.class_objects import PoseLandmarksObject
import numpy as np
from lib.webrtc_ui.webcam_input import save_pose


def create_video_writer(fps: int, frame: av.VideoFrame, video_save_path: str) -> cv2.VideoWriter:
    """Save video as mp4."""
    assert video_save_path is not None
    assert isinstance(frame, av.VideoFrame)
    os.makedirs(os.path.dirname(video_save_path), exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    video = cv2.VideoWriter(video_save_path, fourcc, fps, (frame.width, frame.height))
    print(f"Start saving video to {video_save_path} ...")
    return video


def release_video_writer(video_writer: Union[VideoWriter, None], video_save_path: Union[str, None]) -> None:
    print("Releasing video_writer...")
    assert video_writer is not None
    video_writer.release()
    video_writer = None
    print(f"Video has saved to {video_save_path}")


class TrainingSaver:
    def __init__(self, save_path: Path) -> None:
        save_path.mkdir(parents=True, exist_ok=True)
        assert save_path.is_dir()
        self.pose_save_path: Path = save_path / "pose.pkl"
        self.pose_memory: List[PoseLandmarksObject] = []
        self.video_save_path: Path = save_path / "video.mp4"
        self.video_writer: Union[cv2.VideoWriter, None] = None

    def update(self, pose: Union[PoseLandmarksObject, None], frame, timestamp: float):
        """保存用配列やビデオライターにposeおよびframeを追加していく

        Args:
            pose (Union[PoseLandmarksObject, None]): _description_
            frame (_type_): _description_
            timestamp (_type_): _description_
        """
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
        self.video_writer = create_video_writer(fps=30, frame=frame_to_save, video_save_path=str(self.video_save_path))
        print(f"initialized video writer to save {self.video_save_path}")

    def save(self) -> None:
        # pose の保存（書き出し）
        save_pose(pose_save_path=self.pose_save_path, pose_memory=self.pose_memory)
        self.pose_memory = []
        # 動画の保存（writerの解放）
        release_video_writer(video_writer=self.video_writer, video_save_path=str(self.video_save_path))
