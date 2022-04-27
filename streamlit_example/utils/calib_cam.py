from dataclasses import dataclass
import argparse
import glob
import os
from typing import Tuple, List, Union, Any, NamedTuple

import cv2 as cv
import numpy as np


@dataclass
class CalibConfig:
    board_shape: Tuple[int, int] = (6, 9)
    world_scaling: float = 1.0


def load_video_frames(video_path: str) -> Union[List[cv.Mat], None]:
    cap = cv.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Failed to open video_path: {video_path}, exiting...")
        return

    frames: List[cv.Mat] = []
    while True:
        ret, frame = cap.read()
        # digit = len(str(int(cap.get(cv.CAP_PROP_FRAME_COUNT))))
        if ret:
            frames.append(frame)
        else:
            num_frames: int = len(frames)
            print(f"Finished reading {video_path}, the number of total frames is {num_frames}.")
            break

    return frames


def calib_mono_cam(frames: List[cv.Mat], calib_config: CalibConfig) -> Any:
    """Calibrate mono camera

    Args:
        board_shape (Tuple[int, int]): number of checkerboard rows, columns.
        world_scaling (flaot): change this to the real world square size. Or not.

    Returns:
        _type_: _description_
    """
    rows, columns = calib_config.board_shape
    # criteria used by checkerboard pattern detector.
    # Change this if the code can't find the checkerboard
    criteria = (cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 30, 0.001)

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = calib_config.world_scaling * objp

    # frame dimensions. Frames should be the same size.
    width = frames[0].shape[1]
    height = frames[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints = []  # 2d points in image plane.

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame in frames:
        gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)

        # find the checkerboard
        ret, corners = cv.findChessboardCorners(gray, (rows, columns), None)

        if ret:
            # Convolution size used to improve corner detection. Don't make this too large.
            conv_size = (11, 11)

            # opencv can attempt to improve the checkerboard coordinates
            corners = cv.cornerSubPix(gray, corners, conv_size, (-1, -1), criteria)
            cv.drawChessboardCorners(frame, (rows, columns), corners, ret)
            cv.imshow("img", frame)

            objpoints.append(objp)
            imgpoints.append(corners)

    ret, mtx, dist, rvecs, tvecs = cv.calibrateCamera(objpoints, imgpoints, (width, height), None, None)
    print("rmse:", ret)
    print("camera matrix:\n", mtx)
    print("distortion coeffs:", dist)
    print("Rs:\n", rvecs)
    print("Ts:\n", tvecs)

    return ret, mtx, dist, rvecs, tvecs


def calib_stereo_cam(
    cam1_video_path: str, cam2_video_path: str, cam1_calib_config: CalibConfig, cam2_calib_config: CalibConfig
):
    cam1_frames = load_video_frames(cam1_video_path)
    assert cam1_frames is not None
    cam2_frames = load_video_frames(cam2_video_path)
    assert cam2_frames is not None

    ret1, mtx1, dist1, _, _ = calib_mono_cam(cam1_frames, cam1_calib_config)
    ret2, mtx2, dist2, _, _ = calib_mono_cam(cam2_frames, cam2_calib_config)
    print(f"Finished mono cam calibration ... ret1: {ret1}, ret2: {ret2}")

    # change this if stereo calibration not good.
    criteria = (cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 100, 0.0001)

    # XXX: cam1 と cam2 で calib_config が一致していないといけないかどうかは未検証
    assert cam1_calib_config.board_shape == cam2_calib_config.board_shape
    assert cam1_calib_config.world_scaling == cam2_calib_config.world_scaling
    rows, columns = cam1_calib_config.board_shape

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = cam1_calib_config.world_scaling * objp

    # XXX: cam1 と cam2 で カメラ解像度 が一致していないといけないかどうかは未検証
    assert (cam1_frames[0].shape[0] == cam2_frames[0].shape[0]) and (
        cam1_frames[0].shape[1] == cam2_frames[0].shape[1]
    )
    # frame dimensions. Frames should be the same size.
    width = cam1_frames[0].shape[1]
    height = cam1_frames[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints_left = []  # 2d points in image plane.
    imgpoints_right = []

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame1, frame2 in zip(cam1_frames, cam2_frames):
        gray1 = cv.cvtColor(frame1, cv.COLOR_BGR2GRAY)
        gray2 = cv.cvtColor(frame2, cv.COLOR_BGR2GRAY)
        c_ret1, corners1 = cv.findChessboardCorners(gray1, (rows, columns), None)
        c_ret2, corners2 = cv.findChessboardCorners(gray2, (rows, columns), None)

        if c_ret1 == True and c_ret2 == True:
            corners1 = cv.cornerSubPix(gray1, corners1, (11, 11), (-1, -1), criteria)
            corners2 = cv.cornerSubPix(gray2, corners2, (11, 11), (-1, -1), criteria)

            cv.drawChessboardCorners(frame1, (rows, columns), corners1, c_ret1)
            cv.imshow("img", frame1)

            cv.drawChessboardCorners(frame2, (rows, columns), corners2, c_ret2)
            cv.imshow("img2", frame2)

            objpoints.append(objp)
            imgpoints_left.append(corners1)
            imgpoints_right.append(corners2)

    stereocalibration_flags = cv.CALIB_FIX_INTRINSIC
    ret, CM1, dist1, CM2, dist2, R, T, E, F = cv.stereoCalibrate(
        objpoints,
        imgpoints_left,
        imgpoints_right,
        mtx1,
        dist1,
        mtx2,
        dist2,
        (width, height),
        criteria=criteria,
        flags=stereocalibration_flags,
    )

    print(ret)
    return R, T


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
    calib_mono_cam(frames[:20], CalibConfig())
