from dataclasses import dataclass
from pathlib import Path
from typing import Union, Tuple

import numpy as np
import numpy.typing as npt
import cv2
import av
from skimage.transform import resize
from PIL import Image


@dataclass
class CoachInRestInput:
    frame_shape: Tuple[int, int, int]
    left_video_path: Path
    right_video_path: Path
    report_img_path: Path
    left_pose_path: Union[Path, None] = None
    right_pose_path: Union[Path, None] = None


class CoachInRestManager(object):
    def __init__(self, _inputs: CoachInRestInput):
        self.frame_shape = _inputs.frame_shape
        # TODO: add rest time count-down
        assert _inputs.left_video_path.is_file()
        assert _inputs.right_video_path.is_file()
        # HACK: accelerate iterate speed
        self.left_video_cap: cv2.VideoCapture = cv2.VideoCapture(str(_inputs.left_video_path))
        self.right_video_cap: cv2.VideoCapture = cv2.VideoCapture(str(_inputs.right_video_path))
        assert _inputs.report_img_path.is_file()
        self.report_img: npt.NDArray[np.uint8] = np.array(Image.open(_inputs.report_img_path).convert("RGB"))
        # TODO: draw user pose
        # with open(in_paths.user_video_path) as f:
        #     self.user_pose: List[PoseLandmarksObject] = pickle.load(f)

        self.counter: int = 0

    def __iter__(self):
        return self

    def _resize_frame(self, arr: npt.NDArray[np.uint8], resized_shape: Tuple[int, int]) -> npt.NDArray[np.uint8]:
        # NOTE: resize func returns image as float ndarray even if your original image is uint8
        shrinked_arr: np.ndarray = resize(image=arr, output_shape=resized_shape, anti_aliasing=False)
        return (shrinked_arr * 255).astype(np.uint8)

    def __next__(self) -> av.VideoFrame:
        _left_ret, left_frame = self.left_video_cap.read()
        _right_ret, right_frame = self.right_video_cap.read()
        if not (_left_ret and _right_ret):
            raise StopIteration()

        one_quarter_shape: Tuple[int, int] = (
            self.frame_shape[0] // 2,
            self.frame_shape[1] // 2,
        )

        # init return_frame with white
        return_frame: npt.NDArray[np.uint8] = (np.ones(self.frame_shape, dtype=np.uint8) * 255).astype(np.uint8)

        # upper left
        if _left_ret:
            shrinked_left_frame: npt.NDArray[np.uint8] = self._resize_frame(
                arr=left_frame, resized_shape=one_quarter_shape
            )
            return_frame[0 : one_quarter_shape[0], 0 : one_quarter_shape[1], :] = shrinked_left_frame[:, :, :]
        # upper right
        if _right_ret:
            shrinked_right_frame: npt.NDArray[np.uint8] = self._resize_frame(
                arr=right_frame, resized_shape=one_quarter_shape
            )
            return_frame[0 : one_quarter_shape[0], one_quarter_shape[1] :, :] = shrinked_right_frame[:, :, :]
        # lower right
        # TODO: add report
        # lower left
        report_arr: npt.NDArray[np.uint8] = self._resize_frame(arr=self.report_img, resized_shape=one_quarter_shape)
        return_frame[one_quarter_shape[0] :, one_quarter_shape[1] :, :] = report_arr[:, :, :]

        assert tuple(return_frame.shape) == self.frame_shape

        self.counter += 1

        return return_frame
