import os
import time

import cv2


def save_frame_camera_key(device_num, dir_path, basename, ext="png", delay=1, window_name="frame"):
    cap = cv2.VideoCapture(device_num)

    if not cap.isOpened():
        return

    time.sleep(3)
    os.makedirs(dir_path, exist_ok=True)
    base_path = os.path.join(dir_path, basename)

    n = 0
    while True:
        ret, frame = cap.read()
        cv2.imshow(window_name, frame)
        key = cv2.waitKey(delay) & 0xFF
        if key == ord("c"):
            cv2.imwrite("{}_{}.{}".format(base_path, n, ext), frame)
            print(f"{n} is captured")
            n += 1
        elif key == ord("q"):
            break

    cv2.destroyWindow(window_name)


save_frame_camera_key(0, "test/", "camera_capture")
