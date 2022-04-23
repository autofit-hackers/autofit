import argparse
import os
from typing import Tuple, List, Union

import cv2
import numpy as np


def load_video_frames(video_path: str) -> Union[List[cv2.Mat], None]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Failed to open video_path: {video_path}, exiting...")
        return

    frames: List[cv2.Mat] = []
    while True:
        ret, frame = cap.read()
        # digit = len(str(int(cap.get(cv2.CAP_PROP_FRAME_COUNT))))
        if ret:
            frames.append(frame)
        else:
            num_frames: int = len(frames)
            print(f"Finished reading {video_path}, the number of total frames is {num_frames}.")
            break

    return frames


def calib_mono_cam(
    frames: List[cv2.Mat], board_shape: Tuple[int, int] = (6, 9), world_scaling: float = 1.0
) -> typing.Any:
    """Calibrate mono camera

    Args:
        board_shape (Tuple[int, int]): number of checkerboard rows, columns.
        world_scaling (flaot): change this to the real world square size. Or not.

    Returns:
        _type_: _description_
    """
    rows, columns = board_shape
    # criteria used by checkerboard pattern detector.
    # Change this if the code can't find the checkerboard
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = world_scaling * objp

    # frame dimensions. Frames should be the same size.
    width = frames[0].shape[1]
    height = frames[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints = []  # 2d points in image plane.

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame in frames:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # find the checkerboard
        ret, corners = cv2.findChessboardCorners(gray, (rows, columns), None)

        if ret:
            # Convolution size used to improve corner detection. Don't make this too large.
            conv_size = (11, 11)

            # opencv can attempt to improve the checkerboard coordinates
            corners = cv2.cornerSubPix(gray, corners, conv_size, (-1, -1), criteria)
            cv2.drawChessboardCorners(frame, (rows, columns), corners, ret)
            cv2.imshow("img", frame)

            objpoints.append(objp)
            imgpoints.append(corners)

    ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, (width, height), None, None)
    print("rmse:", ret)
    print("camera matrix:\n", mtx)
    print("distortion coeffs:", dist)
    print("Rs:\n", rvecs)
    print("Ts:\n", tvecs)

    return ret, mtx, dist, rvecs, tvecs


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--video",
        type=str,
        default=r"/Users/kondounagi/Library/Mobile Documents/com~apple~CloudDocs/work/posefit/streamlit_example/videos/2022-04-23-15-16-35_main_cam.mp4",
    )
    args = parser.parse_args()
    assert os.path.exists(args.video) and os.path.isfile(args.video)
    frames = load_video_frames(args.video)
    assert frames is not None
    calib_mono_cam(frames[:20])
