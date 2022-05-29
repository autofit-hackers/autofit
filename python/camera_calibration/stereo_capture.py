import argparse
import time

import cv2
import numpy as np

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--camera-ids", type=int, nargs="+", required=True, help="Camera device id")
    return parser.parse_args()


def main():
    args = get_args()
    # put webcam id as command line arguements
    captures = []
    for idx, camera_id in enumerate(args.camera_id):
        captures.append(cv2.VideoCapture(int(camera_id)))
        print(f"Camera No.{idx} is available: device id = {camera_id}")

    # wait cameras to wake up
    for i in range(3):
        print(f"start in {3-i} sec")
        t0 = time.time()
        time.sleep(1)
        t1 = time.time()

    n = 0
    print("press c to take photo or esc to exit")
    while True:
        frames = []
        for capture in captures:
            _, frame = capture.read()
            frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
            frames.append(frame)
        mergeImg = np.vstack(frames)
        cv2.imshow("webcam inputs", mergeImg)
        key = cv2.waitKey(1) & 0xFF
        if key == ord("c"):
            for idx, frame in enumerate(frames):
                cv2.imwrite(f"camera{idx}_img{n}.png", frame)
            n += 1
            print(f"images_{n} has been captured")
        elif key == 27:
            break

    for capture in captures:
        capture.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()