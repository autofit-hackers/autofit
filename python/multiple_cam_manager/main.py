import argparse
import logging

import cv2
import numpy as np


def ger_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--num-camera", type=int, help="Number of camera", default=2, required=False
    )
    return parser.parse_args()


def init_cams(num_camera: int):
    caps = {}
    for i in range(num_camera):
        cap = cv2.VideoCapture(i)
        if not cap.isOpened():
            logging.error("Camera {} is not available".format(i))
        caps[i] = cap
    return caps


def main():
    args = ger_args()
    caps = init_cams(args.num_camera)
    while True:
        frames = []
        is_avails = []
        for i, cap in caps.items():
            is_avail, frame = cap.read()
            frames.append(frame)
            is_avails.append(is_avail)

        resize_shape = (frames[0].shape[1], frames[0].shape[0])
        # resize_shape = (100, 100)
        resized_frames = [
            cv2.resize(frame, resize_shape)
            for frame, is_avail in zip(frames, is_avails)
            if is_avail
        ]

        # ---- Option 1 ----
        # numpy_vertical = np.vstack((frame1, frame2))
        numpy_horizontal = np.hstack((resized_frames[0], resized_frames[1]))

        # ---- Option 2 ----
        # numpy_vertical_concat = np.concatenate((image, grey_3_channel), axis=0)
        # numpy_horizontal_concat = np.concatenate((frame1, frame2), axis=1)

        cv2.imshow("Result", numpy_horizontal)
        key_input = cv2.waitKey(1)
        if key_input == 27:  # exit on ESC
            break


if __name__ == "__main__":
    main()
