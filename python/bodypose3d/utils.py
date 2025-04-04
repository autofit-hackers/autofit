import queue
import threading

import cv2
import numpy as np
from scipy import linalg


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
    # print('A: ')
    # print(A)

    B = A.transpose() @ A

    U, s, Vh = linalg.svd(B, full_matrices=False)

    # print('Triangulated point: ')
    # print(Vh[3,0:3]/Vh[3,3])
    return Vh[3, 0:3] / Vh[3, 3]


def read_camera_parameters(camera_id, savefolder="camera_parameters/"):

    cmtx = np.loadtxt(savefolder + "c" + str(camera_id) + "_mtx.dat")
    dist = np.loadtxt(savefolder + "c" + str(camera_id) + "_dist.dat")

    return cmtx, dist


def read_rotation_translation(camera_id, savefolder="camera_parameters/"):

    rot = np.loadtxt(savefolder + "c" + str(camera_id) + "_rot.dat")
    trans = np.loadtxt(savefolder + "c" + str(camera_id) + "_trans.dat")

    return rot, trans


def _convert_to_homogeneous(pts):

    pts = np.array(pts)
    if len(pts.shape) > 1:
        w = np.ones((pts.shape[0], 1))
        return np.concatenate([pts, w], axis=1)
    else:
        return np.concatenate([pts, [1]], axis=0)


def get_projection_matrix(camera_id):

    # read camera parameters
    cmtx, dist = read_camera_parameters(camera_id)
    rvec, tvec = read_rotation_translation(camera_id)

    # calculate projection matrix
    P = cmtx @ _make_homogeneous_rep_matrix(rvec, tvec)[:3, :]
    return P


def save_keypoints_to_disk(filename, kpts):

    fout = open(filename, "w")

    for frame_kpts in kpts:
        for kpt in frame_kpts:
            if len(kpt) == 2:
                fout.write(str(kpt[0]) + " " + str(kpt[1]) + " ")
            else:
                fout.write(str(kpt[0]) + " " + str(kpt[1]) + " " + str(kpt[2]) + " ")

        fout.write("\n")
    fout.close()


# general rotation matrices
def get_R_x(theta):
    R = np.array([[1, 0, 0], [0, np.cos(theta), -np.sin(theta)], [0, np.sin(theta), np.cos(theta)]])
    return R


def get_R_y(theta):
    R = np.array([[np.cos(theta), 0, np.sin(theta)], [0, 1, 0], [-np.sin(theta), 0, np.cos(theta)]])
    return R


def get_R_z(theta):
    R = np.array([[np.cos(theta), -np.sin(theta), 0], [np.sin(theta), np.cos(theta), 0], [0, 0, 1]])
    return R


# calculate rotation matrix to take A vector to B vector
def Get_R(A, B):

    # get unit vectors
    uA = A / np.sqrt(np.sum(np.square(A)))
    uB = B / np.sqrt(np.sum(np.square(B)))

    # get products
    dotprod = np.sum(uA * uB)
    crossprod = np.sqrt(np.sum(np.square(np.cross(uA, uB))))  # magnitude

    # get new unit vectors
    u = uA
    v = uB - dotprod * uA
    v = v / np.sqrt(np.sum(np.square(v)))
    w = np.cross(uA, uB)
    w = w / np.sqrt(np.sum(np.square(w)))

    # get change of basis matrix
    C = np.array([u, v, w])

    # get rotation matrix in new basis
    R_uvw = np.array([[dotprod, -crossprod, 0], [crossprod, dotprod, 0], [0, 0, 1]])

    # full rotation matrix
    R = C.T @ R_uvw @ C
    # print(R)
    return R


# Same calculation as above using a different formalism
def Get_R2(A, B):

    # get unit vectors
    uA = A / np.sqrt(np.sum(np.square(A)))
    uB = B / np.sqrt(np.sum(np.square(B)))

    v = np.cross(uA, uB)
    s = np.sqrt(np.sum(np.square(v)))
    c = np.sum(uA * uB)

    vx = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])

    R = np.eye(3) + vx + vx @ vx * ((1 - c) / s**2)

    return R


# decomposes given R matrix into rotation along each axis. In this case Rz @ Ry @ Rx
def Decompose_R_ZYX(R):

    # decomposes as RzRyRx. Note the order: ZYX <- rotation by x first
    thetaz = np.arctan2(R[1, 0], R[0, 0])
    thetay = np.arctan2(-R[2, 0], np.sqrt(R[2, 1] ** 2 + R[2, 2] ** 2))
    thetax = np.arctan2(R[2, 1], R[2, 2])

    return thetaz, thetay, thetax


def Decompose_R_ZXY(R):

    # decomposes as RzRXRy. Note the order: ZXY <- rotation by y first
    thetaz = np.arctan2(-R[0, 1], R[1, 1])
    thetay = np.arctan2(-R[2, 0], R[2, 2])
    thetax = np.arctan2(R[2, 1], np.sqrt(R[2, 0] ** 2 + R[2, 2] ** 2))

    return thetaz, thetay, thetax


class ThreadingVideoCapture:
    def __init__(self, src, max_queue_size=256):
        self.video = cv2.VideoCapture(src)
        self.q = queue.Queue(maxsize=max_queue_size)
        self.stopped = False
        self.start()

    def start(self):
        thread = threading.Thread(target=self.update, daemon=True)
        thread.start()
        return self

    def update(self):
        while True:

            if self.stopped:
                return

            if not self.q.full():

                ok, frame = self.video.read()
                self.q.put((ok, frame))

                if not ok:
                    self.stop()
                    return

    def read(self):
        return self.q.get()

    def stop(self):
        self.stopped = True

    def release(self):
        self.stopped = True
        self.video.release()

    def isOpened(self):
        return self.video.isOpened()

    def get(self, i):
        return self.video.get(i)
