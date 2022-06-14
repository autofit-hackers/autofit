from dataclasses import dataclass
from pathlib import Path

import cv2
import av


@dataclass
class CoachInRestInput:
    main_video_path: Path
    main_pose_path: Path


class CoachInRestManager(object):
    def __init__(self, in_paths: CoachInRestInput):
        # TODO: draw user pose
        # TODO: add rest time count-down
        # assert in_paths.user_pose_path.is_file()
        assert in_paths.main_video_path.is_file()
        self.user_video_cap: cv2.VideoCapture = cv2.VideoCapture(str(in_paths.main_video_path))
        # with open(in_paths.user_video_path) as f:
        #     self.user_pose: List[PoseLandmarksObject] = pickle.load(f)

        self.counter: int = 0

    def __iter__(self):
        return self

    def __next__(self) -> av.VideoFrame:
        _ret, _frame = self.user_video_cap.read()

        if _ret is False:
            raise StopIteration()

        return _frame
