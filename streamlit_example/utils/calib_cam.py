from typing import List, Union

import cv2


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
