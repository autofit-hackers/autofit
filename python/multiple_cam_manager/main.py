import argparse
import logging
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np


OUTPUT_DIR = "output"


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


def init_video_writer(
    path_to_save: str | None,
    size: tuple[int, int],
    fps: int = 30,
):
    if path_to_save is None:
        now = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = Path(OUTPUT_DIR)
        output_dir.mkdir(exist_ok=True)
        path_to_save = output_dir / f"{now}.avi"
    print(f"saving video to {path_to_save}...")
    return cv2.VideoWriter(
        str(path_to_save),
        cv2.VideoWriter_fourcc(*"MJPG"),
        fps,
        size,
    )


def main():
    args = ger_args()
    caps = init_cams(args.num_camera)
    video_writer = None

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

        if video_writer is None:
            concatted_shape = (numpy_horizontal.shape[1], numpy_horizontal.shape[0])
            video_writer = init_video_writer(path_to_save=None, size=concatted_shape)

        video_writer.write(numpy_horizontal)

        cv2.imshow("Result", numpy_horizontal)
        key_input = cv2.waitKey(20)
        if key_input == 27:  # exit on ESC
            video_writer.release()
            for cap in caps.values():
                cap.release()
            break


if __name__ == "__main__":
    main()
