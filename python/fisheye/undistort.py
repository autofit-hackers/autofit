import numpy as np
import cv2
import sys
import os

# You should replace these 3 lines with the output in calibration step
DIM = (1280, 1024)
K = np.array(
    [
        [594.2666338395271, 0.0, 680.8557056418232],
        [0.0, 636.3165175513953, 504.0288980900962],
        [0.0, 0.0, 1.0],
    ]
)
D = np.array(
    [
        [-0.043040697034657086],
        [-0.02666222243424682],
        [0.036002666173483515],
        [-0.01544106217572618],
    ]
)


def undistort(img_path):
    img = cv2.imread(img_path)
    h, w = img.shape[:2]
    map1, map2 = cv2.fisheye.initUndistortRectifyMap(
        K, D, np.eye(3), K, DIM, cv2.CV_16SC2
    )
    print(map1.shape(), map2.shape(), "map1, map2")
    undistorted_img = cv2.remap(
        img, map1, map2, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT
    )
    # cv2.imshow("undistorted", undistorted_img)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    cv2.imwrite("out_" + os.path.basename(img_path), undistorted_img)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        undistort(p)
