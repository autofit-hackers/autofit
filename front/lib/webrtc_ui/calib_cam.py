import argparse
import glob
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, List, NamedTuple, Tuple, Union

import cv2
import numpy as np
from scipy import linalg


@dataclass
class CalibConfig:
    board_shape: Tuple[int, int] = (5, 7)
    square_size: float = 7.0
    # criteria used by checkerboard pattern detector.
    # Change this if the code can't find the checkerboard
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001)


@dataclass
class CameraState:
    name: str
    rmse: float = 0
    matrix: np.ndarray = np.zeros((3, 3))
    distortion_coeffs: np.ndarray = np.zeros((1, 5))
    rotation: np.ndarray = np.zeros((3, 3))
    trans: np.ndarray = np.zeros((3, 1))


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


def single_calibrate(calib_config: CalibConfig, camera_state: CameraState, base_dir: str) -> float:
    imgs_dir = f"{base_dir}/{camera_state.name}/imgs"
    print(imgs_dir)
    rows = calib_config.board_shape[0]
    columns = calib_config.board_shape[1]
    square_size = calib_config.square_size
    criteria = calib_config.criteria

    images_names = sorted(glob.glob(f"{imgs_dir}/*.png"))
    print(images_names)
    images = []
    for imname in images_names:
        im = cv2.imread(imname, 1)
        images.append(im)
    print(len(images))

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = square_size * objp

    # frame dimensions. Frames should be the same size.
    width = images[0].shape[1]
    height = images[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints = []  # 2d points in image plane.

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame in images:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # find the checkerboard
        ret, corners = cv2.findChessboardCorners(gray, (rows, columns), None)

        if ret == True:

            # Convolution size used to improve corner detection. Don't make this too large.
            conv_size = (11, 11)

            # opencv can attempt to improve the checkerboard coordinates
            corners = cv2.cornerSubPix(gray, corners, conv_size, (-1, -1), criteria)
            cv2.drawChessboardCorners(frame, (rows, columns), corners, ret)

            objpoints.append(objp)
            imgpoints.append(corners)

    assert len(objpoints) > 0
    assert len(imgpoints) > 0

    ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, (width, height), None, None)
    print("rmse:", ret)

    camera_state.rmse = ret
    camera_state.matrix = mtx
    camera_state.distortion_coeffs = dist

    np.savetxt(f"{base_dir}/{camera_state.name}/mtx.dat", mtx)
    np.savetxt(f"{base_dir}/{camera_state.name}/dist.dat", dist)

    return ret


def stereo_calibrate(
    calib_config: CalibConfig, front_camera_state: CameraState, side_camera_state: CameraState, base_dir: str
) -> float:
    images_dir_front = Path(f"{base_dir}/{front_camera_state.name}/imgs")
    images_dir_side = Path(f"{base_dir}/{side_camera_state.name}/imgs")

    rows = calib_config.board_shape[0]
    columns = calib_config.board_shape[1]
    square_size = calib_config.square_size
    criteria = calib_config.criteria

    c1_images_names = sorted(list(images_dir_front.glob("*.png")))
    c2_images_names = sorted(list(images_dir_side.glob("*.png")))

    c1_images = []
    c2_images = []
    for im1, im2 in zip(c1_images_names, c2_images_names):
        _im = cv2.imread(str(im1), 1)
        c1_images.append(_im)

        _im = cv2.imread(str(im2), 1)
        c2_images.append(_im)

        print(im1, im2)

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = square_size * objp

    # frame dimensions. Frames should be the same size.
    width = c1_images[0].shape[1]
    height = c1_images[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints_left = []  # 2d points in image plane.
    imgpoints_right = []

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame1, frame2 in zip(c1_images, c2_images):
        gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
        c_ret1, corners1 = cv2.findChessboardCorners(gray1, (rows, columns), None)
        c_ret2, corners2 = cv2.findChessboardCorners(gray2, (rows, columns), None)
        print("c_ret1", c_ret1)
        print("c_ret2", c_ret2)

        if c_ret1 == True and c_ret2 == True:
            corners1 = cv2.cornerSubPix(gray1, corners1, (11, 11), (-1, -1), criteria)
            corners2 = cv2.cornerSubPix(gray2, corners2, (11, 11), (-1, -1), criteria)

            cv2.drawChessboardCorners(frame1, (rows, columns), corners1, c_ret1)

            cv2.drawChessboardCorners(frame2, (rows, columns), corners2, c_ret2)

            objpoints.append(objp)
            imgpoints_left.append(corners1)
            imgpoints_right.append(corners2)

    assert len(imgpoints_left) > 0
    assert len(imgpoints_right) > 0

    stereocalibration_flags = cv2.CALIB_FIX_INTRINSIC
    mtx_front = front_camera_state.matrix
    dist_front = front_camera_state.distortion_coeffs
    mtx_side = side_camera_state.matrix
    dist_side = side_camera_state.distortion_coeffs

    ret, CM1, dist_front, CM2, dist_side, R, T, E, F = cv2.stereoCalibrate(
        objpoints,
        imgpoints_left,
        imgpoints_right,
        mtx_front,
        dist_front,
        mtx_side,
        dist_side,
        (width, height),
        criteria=criteria,
        flags=stereocalibration_flags,
    )

    print("rmse:", ret)

    np.savetxt(f"{base_dir}/{front_camera_state.name}/rot.dat", np.eye(3))
    np.savetxt(f"{base_dir}/{front_camera_state.name}/trans.dat", np.array([[0], [0], [0]]))
    np.savetxt(f"{base_dir}/{side_camera_state.name}/rot.dat", R)
    np.savetxt(f"{base_dir}/{side_camera_state.name}/trans.dat", T)

    return ret


def _make_homogeneous_rep_matrix(R, t):
    P = np.zeros((4, 4))
    P[:3, :3] = R
    P[:3, 3] = t.reshape(3)
    P[3, 3] = 1
    return P


# direct linear transform
def DLT(P1, P2, point1, point2):
    A = [
        point1[1] * P1[2, :] - P1[1, :],
        P1[0, :] - point1[0] * P1[2, :],
        point2[1] * P2[2, :] - P2[1, :],
        P2[0, :] - point2[0] * P2[2, :],
    ]
    A = np.array(A).reshape((4, 4))
    B = A.transpose() @ A
    U, s, Vh = linalg.svd(B, full_matrices=False)

    return Vh[3, 0:3] / Vh[3, 3]


# def _convert_to_homogeneous(pts):
#     pts = np.array(pts)
#     if len(pts.shape) > 1:
#         w = np.ones((pts.shape[0], 1))
#         return np.concatenate([pts, w], axis=1)
#     else:
#         return np.concatenate([pts, [1]], axis=0)


def get_projection_matrix(camera_info_path: Path, camera_type: str):
    # read camera parameters
    cmtx = np.loadtxt(Path(f"{camera_info_path}/{camera_type}/mtx.dat"))
    dist = np.loadtxt(Path(f"{camera_info_path}/{camera_type}/dist.dat"))
    rot = np.loadtxt(Path(f"{camera_info_path}/{camera_type}/rot.dat"))
    trans = np.loadtxt(Path(f"{camera_info_path}/{camera_type}/trans.dat"))
    # calculate projection matrix
    P = cmtx @ _make_homogeneous_rep_matrix(rot, trans)[:3, :]
    return P


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
    # single_calibrate(frames[:20], CalibConfig())
