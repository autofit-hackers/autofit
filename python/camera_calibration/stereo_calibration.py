import glob

import cv2 as cv
import numpy as np

# criteria used by checkerboard pattern detector.
# Change this if the code can't find the checkerboard
criteria = (cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 30, 0.001)

rows = 5  # number of checkerboard rows.
columns = 8  # number of checkerboard columns.
world_scaling = 1  # change this to the real world square size. Or not.


def calibrate_camera(images_folder):
    images_names = sorted(glob.glob(images_folder))
    images = []
    for imname in images_names:
        im = cv.imread(imname, 1)
        images.append(im)

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = world_scaling * objp

    # frame dimensions. Frames should be the same size.
    width = images[0].shape[1]
    height = images[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints = []  # 2d points in image plane.

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame in images:
        gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)

        # find the checkerboard
        ret, corners = cv.findChessboardCorners(gray, (rows, columns), None)

        if ret == True:

            # Convolution size used to improve corner detection. Don't make this too large.
            conv_size = (11, 11)

            # opencv can attempt to improve the checkerboard coordinates
            corners = cv.cornerSubPix(gray, corners, conv_size, (-1, -1), criteria)
            cv.drawChessboardCorners(frame, (rows, columns), corners, ret)
            cv.imshow("img", frame)
            k = cv.waitKey(500)

            objpoints.append(objp)
            imgpoints.append(corners)

    ret, mtx, dist, rvecs, tvecs = cv.calibrateCamera(objpoints, imgpoints, (width, height), None, None)
    print("rmse:", ret)
    print("camera matrix:\n", mtx)
    print("distortion coeffs:", dist)

    return mtx, dist


def stereo_calibrate(mtx1, dist1, mtx2, dist2, frames_folder):
    # read the synched frames
    images_names = glob.glob(frames_folder)
    images_names = sorted(images_names)
    c1_images_names = images_names[: len(images_names) // 2]
    c2_images_names = images_names[len(images_names) // 2 :]

    c1_images = []
    c2_images = []
    for im1, im2 in zip(c1_images_names, c2_images_names):
        _im = cv.imread(im1, 1)
        c1_images.append(_im)

        _im = cv.imread(im2, 1)
        c2_images.append(_im)

    # coordinates of squares in the checkerboard world space
    objp = np.zeros((rows * columns, 3), np.float32)
    objp[:, :2] = np.mgrid[0:rows, 0:columns].T.reshape(-1, 2)
    objp = world_scaling * objp

    # frame dimensions. Frames should be the same size.
    width = c1_images[0].shape[1]
    height = c1_images[0].shape[0]

    # Pixel coordinates of checkerboards
    imgpoints_left = []  # 2d points in image plane.
    imgpoints_right = []

    # coordinates of the checkerboard in checkerboard world space.
    objpoints = []  # 3d point in real world space

    for frame1, frame2 in zip(c1_images, c2_images):
        gray1 = cv.cvtColor(frame1, cv.COLOR_BGR2GRAY)
        gray2 = cv.cvtColor(frame2, cv.COLOR_BGR2GRAY)
        c_ret1, corners1 = cv.findChessboardCorners(gray1, (5, 8), None)
        c_ret2, corners2 = cv.findChessboardCorners(gray2, (5, 8), None)

        if c_ret1 == True and c_ret2 == True:
            corners1 = cv.cornerSubPix(gray1, corners1, (11, 11), (-1, -1), criteria)
            corners2 = cv.cornerSubPix(gray2, corners2, (11, 11), (-1, -1), criteria)

            cv.drawChessboardCorners(frame1, (5, 8), corners1, c_ret1)
            cv.imshow("img", frame1)

            cv.drawChessboardCorners(frame2, (5, 8), corners2, c_ret2)
            cv.imshow("img2", frame2)
            k = cv.waitKey(500)

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


# num_camera = 2
# for camera_id in range(num_camera):
#     mtx, dist, rot, trans = calibrate_camera(images_folder="D2/*")
#     np.savetxt(f'../bodypose3d/camera_parameters/c{camera_id}_mtx.dat', mtx)
#     np.savetxt(f'../bodypose3d/camera_parameters/c{camera_id}_dist.dat', dist)
#     np.savetxt(f'../bodypose3d/camera_parameters/c{camera_id}_rot.dat', rot)
#     np.savetxt(f'../bodypose3d/camera_parameters/c{camera_id}_trans.dat', trans)


mtx1, dist1 = calibrate_camera(images_folder="D2/*")
mtx2, dist2 = calibrate_camera(images_folder="J2/*")
R, T = stereo_calibrate(mtx1, dist1, mtx2, dist2, "synched/*")

print(R)
print(T)
np.savetxt("../bodypose3d/camera_parameters/c0_mtx.dat", mtx1)
np.savetxt("../bodypose3d/camera_parameters/c0_dist.dat", dist1)
np.savetxt("../bodypose3d/camera_parameters/c0_rot.dat", np.eye(3))
np.savetxt("../bodypose3d/camera_parameters/c0_trans.dat", np.array([[0], [0], [0]]))
np.savetxt("../bodypose3d/camera_parameters/c1_mtx.dat", mtx2)
np.savetxt("../bodypose3d/camera_parameters/c1_dist.dat", dist2)
np.savetxt("../bodypose3d/camera_parameters/c1_rot.dat", R)
np.savetxt("../bodypose3d/camera_parameters/c1_trans.dat", T)
