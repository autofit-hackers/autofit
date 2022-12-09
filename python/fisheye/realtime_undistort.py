import cv2
import time
import numpy as np
import sys
import os

# You should replace these 3 lines with the output in calibration step
DIM = (1920, 1080)
K = np.array(
    [
        [610.3015502517118, 0.0, 982.1178976904179],
        [0.0, 607.6358585073284, 493.4913068733442],
        [0.0, 0.0, 1.0],
    ]
)
D = np.array(
    [
        [-0.025049992608213376],
        [0.003654612746897556],
        [0.00014795581550779708],
        [-0.000627061538611659],
    ]
)

# VideoCapture オブジェクトを取得します
capture = cv2.VideoCapture(1)
time.sleep(3)


def undistort(frame):
    h, w = frame.shape[:2]
    map1, map2 = cv2.fisheye.initUndistortRectifyMap(
        K, D, np.eye(3), K, DIM, cv2.CV_16SC2
    )
    undistorted_img = cv2.remap(
        frame,
        map1,
        map2,
        interpolation=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
    )
    return undistorted_img


while True:
    ret, frame = capture.read()
    cv2.imshow("frame", undistort(frame))
    cv2.imshow("raw", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

capture.release()
cv2.destroyAllWindows()
