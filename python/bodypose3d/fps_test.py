import datetime
import sys
import time

import cv2
import mediapipe as mp
import numpy as np

from utils import DLT, get_projection_matrix, write_keypoints_to_disk

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose

frame_shape = [720, 1280]
min_confidence = 0.1
record_dir = "./pose_record/"

# add here if you need more keypoints
# pose_keypoints = [16, 14, 12, 11, 13, 15, 24, 23, 25, 26, 27, 28]
# include head
pose_keypoints = [16, 14, 12, 11, 13, 15, 24, 23, 25, 26, 27, 28, 0]


def run_mp(input_stream1, P0, P1):
    # input video stream
    cap0 = cv2.VideoCapture(input_stream1)
    cap0.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc("H", "2", "6", "4"))

    # wait cameras to wake up
    for i in range(5):
        print(f"start in {5-i} sec")
        t0 = time.time()
        time.sleep(1)
        t1 = time.time()

    # set camera resolution if using webcam to 1280x720. Any bigger will cause some lag for hand detection
    cap0.set(3, frame_shape[1])
    cap0.set(4, frame_shape[0])

    # create body keypoints detector objects.
    pose0 = mp_pose.Pose(min_detection_confidence=min_confidence, min_tracking_confidence=min_confidence)

    # containers for detected keypoints for each camera. These are filled at each frame.
    # This will run you into memory issue if you run the program without stop
    kpts_cam0 = []

    # 開始時間
    start = time.time()
    num_frames = 0
    while True:
        num_frames += 1
        # read frames from stream
        ret0, frame0 = cap0.read()

        if not ret0:
            break

        # rotate inputs
        frame0 = cv2.rotate(frame0, cv2.ROTATE_90_COUNTERCLOCKWISE)

        # crop to 720x720.
        # Note: camera calibration parameters are set to this resolution.If you change this, make sure to also change camera intrinsic parameters
        if frame0.shape[1] != 720:
            frame0 = frame0[:, frame_shape[1] // 2 - frame_shape[0] // 2 : frame_shape[1] // 2 + frame_shape[0] // 2]

        # the BGR image to RGB.
        frame0 = cv2.cvtColor(frame0, cv2.COLOR_BGR2RGB)

        # To improve performance, optionally mark the image as not writeable to
        # pass by reference.
        frame0.flags.writeable = False
        results0 = pose0.process(frame0)

        # reverse changes
        frame0.flags.writeable = True
        frame0 = cv2.cvtColor(frame0, cv2.COLOR_RGB2BGR)

        # check for keypoints detection
        frame0_keypoints = []
        if results0.pose_landmarks:
            for i, landmark in enumerate(results0.pose_landmarks.landmark):
                if i not in pose_keypoints:
                    continue  # only save keypoints that are indicated in pose_keypoints
                pxl_x = landmark.x * frame0.shape[1]
                pxl_y = landmark.y * frame0.shape[0]
                pxl_x = int(round(pxl_x))
                pxl_y = int(round(pxl_y))
                cv2.circle(frame0, (pxl_x, pxl_y), 3, (0, 0, 255), -1)  # add keypoint detection points into figure
                kpts = [pxl_x, pxl_y]
                frame0_keypoints.append(kpts)
        else:
            # if no keypoints are found, simply fill the frame data with [-1,-1] for each kpt
            frame0_keypoints = [[-1, -1]] * len(pose_keypoints)

        # this will keep keypoints of this frame in memory
        kpts_cam0.append(frame0_keypoints)

        # uncomment these if you want to see the full keypoints detections
        mp_drawing.draw_landmarks(
            frame0,
            results0.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
        )

        cv2.imshow("front", frame0)

        k = cv2.waitKey(1)
        if k & 0xFF == 27:
            # 終了時間
            end = time.time()
            fps = num_frames / (end - start)
            print(f"FPS:{fps}")
            break  # 27 is ESC key.

    cv2.destroyAllWindows()
    cap0.release()

    return np.array(kpts_cam0)


if __name__ == "__main__":

    # this will load the sample videos if no camera ID is given
    input_stream1 = "media/cam0_test.mp4"

    # put camera id as command line arguements
    if len(sys.argv) == 2:
        input_stream1 = int(sys.argv[1])

    # get projection matrices
    P0 = get_projection_matrix(0)
    P1 = get_projection_matrix(1)

    kpts_cam0 = run_mp(input_stream1, P0, P1)
