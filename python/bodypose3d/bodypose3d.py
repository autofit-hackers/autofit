import datetime
import sys
import time
from xml.etree.ElementInclude import include

import cv2
import matplotlib.pyplot as plt
import mediapipe as mp
import numpy as np

from utils import DLT, get_projection_matrix, save_keypoints_to_disk

"""mediapipe setting"""
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose

"""file saving setting"""
pose_record_dir = "./pose_record"
video_record_dir = "./video_record"
now = datetime.datetime.now().strftime("%m-%d-%H-%M")

"""keypoint setting"""
include_head = True
pose_keypoints = [16, 14, 12, 11, 13, 15, 24, 23, 25, 26, 27, 28]
if include_head:
    pose_keypoints.append(0)

"""2D pose vizualization setting"""
frame_shape = [720, 1280]
min_confidence = 0.1
show_2d_estimation = False

"""3D pose vizualization setting"""
torso = [[0, 1], [1, 7], [7, 6], [6, 0]]
armr = [[1, 3], [3, 5]]
arml = [[0, 2], [2, 4]]
legr = [[6, 8], [8, 10]]
legl = [[7, 9], [9, 11]]
body = [torso, arml, armr, legr, legl]
colors = ["red", "blue", "blue", "black", "black"]


def run_realtime_pose_estimation(input_stream1, input_stream2, P0, P1):

    # input video stream
    cap0 = cv2.VideoCapture(input_stream1)
    cap1 = cv2.VideoCapture(input_stream2)
    print(f"camera1 is available:{cap0.isOpened()}")
    print(f"camera2 is available:{cap1.isOpened()}")
    caps = [cap0, cap1]

    # wait cameras to wake up
    for i in range(5):
        print(f"start in {5-i} sec")
        t0 = time.time()
        time.sleep(1)
        t1 = time.time()

    # video saving config
    cap0.set(cv2.CAP_PROP_FPS, 120)
    fps = int(cap0.get(cv2.CAP_PROP_FPS))
    w = int(cap0.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap0.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc("m", "p", "4", "v")
    video_front = cv2.VideoWriter(
        f"{video_record_dir}/video_front_{now}.mp4", fourcc, fps, (h, w)
    )  # exchange width and height because of imput rotation
    video_side = cv2.VideoWriter(f"{video_record_dir}/video_side_{now}.mp4", fourcc, fps, (h, w))

    # set resolution if using webcam to 1280x720. Any bigger will cause some lag for keypoint detection
    for cap in caps:
        cap.set(3, frame_shape[1])
        cap.set(4, frame_shape[0])

    # create body keypoints detector objects.
    pose0 = mp_pose.Pose(min_detection_confidence=min_confidence, min_tracking_confidence=min_confidence)
    pose1 = mp_pose.Pose(min_detection_confidence=min_confidence, min_tracking_confidence=min_confidence)

    # containers for detected keypoints for each cap0. These are filled at each frame.
    # This will run you into memory issue if you run the program without stop
    kpts_cam0 = []
    kpts_cam1 = []
    kpts_3d = []

    # prepare matplotlib for 3D pose vizualization
    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    while True:
        start = time.time()
        # read frames from stream
        ret0, frame0 = cap0.read()
        ret1, frame1 = cap1.read()

        # save frame
        video_front.write(frame0)
        video_side.write(frame1)

        if not ret0 or not ret1:
            break

        # rotate inputs
        frame0 = cv2.rotate(frame0, cv2.ROTATE_90_COUNTERCLOCKWISE)
        frame1 = cv2.rotate(frame1, cv2.ROTATE_90_COUNTERCLOCKWISE)

        # crop to 720x720.
        # Note: cap0 calibration parameters are set to this resolution.If you change this, make sure to also change cap0 intrinsic parameters
        if frame0.shape[1] != 720:
            frame0 = frame0[:, frame_shape[1] // 2 - frame_shape[0] // 2 : frame_shape[1] // 2 + frame_shape[0] // 2]
            frame1 = frame1[:, frame_shape[1] // 2 - frame_shape[0] // 2 : frame_shape[1] // 2 + frame_shape[0] // 2]

        # the BGR image to RGB.
        frame0 = cv2.cvtColor(frame0, cv2.COLOR_BGR2RGB)
        frame1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2RGB)

        # To improve performance, optionally mark the image as not writeable to
        # pass by reference.
        frame0.flags.writeable = False
        frame1.flags.writeable = False
        results0 = pose0.process(frame0)
        results1 = pose1.process(frame1)

        # reverse changes
        frame0.flags.writeable = True
        frame1.flags.writeable = True
        frame0 = cv2.cvtColor(frame0, cv2.COLOR_RGB2BGR)
        frame1 = cv2.cvtColor(frame1, cv2.COLOR_RGB2BGR)

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
                frame_p3ds = [pxl_x, pxl_y]
                frame0_keypoints.append(frame_p3ds)
        else:
            # if no keypoints are found, simply fill the frame data with [-1,-1] for each kpt
            frame0_keypoints = [[-1, -1]] * len(pose_keypoints)

        # this will keep keypoints of this frame in memory
        kpts_cam0.append(frame0_keypoints)

        frame1_keypoints = []
        if results1.pose_landmarks:
            for i, landmark in enumerate(results1.pose_landmarks.landmark):
                if i not in pose_keypoints:
                    continue
                pxl_x = landmark.x * frame0.shape[1]
                pxl_y = landmark.y * frame0.shape[0]
                pxl_x = int(round(pxl_x))
                pxl_y = int(round(pxl_y))
                cv2.circle(frame1, (pxl_x, pxl_y), 3, (0, 0, 255), -1)
                frame_p3ds = [pxl_x, pxl_y]
                frame1_keypoints.append(frame_p3ds)

        else:
            # if no keypoints are found, simply fill the frame data with [-1,-1] for each kpt
            frame1_keypoints = [[-1, -1]] * len(pose_keypoints)

        # update keypoints container
        kpts_cam1.append(frame1_keypoints)

        if show_2d_estimation:
            mp_drawing.draw_landmarks(
                frame0,
                results0.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
            )

            mp_drawing.draw_landmarks(
                frame1,
                results1.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
            )

        end = time.time()
        totalTime = end - start

        fps = 1 / totalTime

        cv2.putText(frame0, f"FPS: {int(fps)}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 2)
        cv2.putText(frame1, f"FPS: {int(fps)}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 2)

        cv2.imshow("front", frame0)
        cv2.imshow("side", frame1)

        k = cv2.waitKey(1)
        if k & 0xFF == 27:  # 27 is ESC key.
            break

        # calculate 3d position
        frame_p3ds = []
        for uv1, uv2 in zip(frame0_keypoints, frame1_keypoints):
            if uv1[0] == -1 or uv2[0] == -1:
                _p3d = [-1, -1, -1]
            else:
                _p3d = DLT(P0, P1, uv1, uv2)
            frame_p3ds.append(_p3d)

        """
        This contains the 3d position of each keypoint in current frame.
        For real time application, this is what you want.
        """
        frame_p3ds = np.array(frame_p3ds).reshape((len(pose_keypoints), 3))
        kpts_3d.append(frame_p3ds)

        # set the center of feet to [0,0,0]
        frame_p3ds = frame_p3ds - (frame_p3ds[10, :] + frame_p3ds[11, :]) / 2 + [0, 0, 50]

        # 3D pose vizualization
        for bodypart, part_color in zip(body, colors):
            for _c in bodypart:
                ax.plot(
                    xs=[frame_p3ds[_c[0], 0], frame_p3ds[_c[1], 0]],
                    ys=[frame_p3ds[_c[0], 1], frame_p3ds[_c[1], 1]],
                    zs=[frame_p3ds[_c[0], 2], frame_p3ds[_c[1], 2]],
                    linewidth=4,
                    c=part_color,
                )

        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_zticks([])
        ax.set_xlim3d(-50, 50)
        ax.set_xlabel("x")
        ax.set_ylim3d(-50, 50)
        ax.set_ylabel("y")
        ax.set_zlim3d(50, 100)
        ax.set_zlabel("z")
        plt.pause(0.001)
        ax.cla()

    cv2.destroyAllWindows()
    for cap in caps:
        cap.release()

    return np.array(kpts_cam0), np.array(kpts_cam1), np.array(kpts_3d)


def main():
    # put webcam id as command line arguements
    if len(sys.argv) == 3:
        input_stream1 = int(sys.argv[1])
        input_stream2 = int(sys.argv[2])
    else:
        print("Call program with input webcam!")
        quit()

    # get projection matrices
    P0 = get_projection_matrix(0)
    P1 = get_projection_matrix(1)

    kpts_cam0, kpts_cam1, kpts_3d = run_realtime_pose_estimation(input_stream1, input_stream2, P0, P1)

    # create keypoint save file
    save_keypoints_to_disk(f"{pose_record_dir}/kpts_cam_front_{now}.dat", kpts_cam0)
    save_keypoints_to_disk(f"{pose_record_dir}/kpts_cam_side_{now}.dat", kpts_cam1)
    save_keypoints_to_disk(f"{pose_record_dir}/kpts_3d_{now}.dat", kpts_3d)


if __name__ == "__main__":

    main()
