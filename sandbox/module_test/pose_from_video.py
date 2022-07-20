import cv2
import mediapipe as mp
import argparse
import os

mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose

parser = argparse.ArgumentParser()
parser.add_argument("video_paths", nargs="*")
args = parser.parse_args()

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=2) as pose:
    for video_path in args.video_paths:
        print(video_path)
        input_video = cv2.VideoCapture(video_path)
        fourcc = cv2.VideoWriter_fourcc("m", "p", "4", "v")
        width = int(input_video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(input_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(input_video.get(cv2.CAP_PROP_FPS))
        basename_without_ext = os.path.splitext(os.path.basename(video_path))[0]
        record_video = cv2.VideoWriter(
            f"{os.path.dirname(video_path)}/{basename_without_ext}_pose.mp4", fourcc, fps, (width, height)
        )

        while input_video.isOpened():
            success, image = input_video.read()
            if not success:
                # If loading a video, use 'break' instead of 'continue'.
                continue

            # To improve performance, optionally mark the image as not writeable to
            # pass by reference.
            image.flags.writeable = False
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = pose.process(image)

            # Draw the pose annotation on the image.
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            mp_drawing.draw_landmarks(
                image,
                results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
            )
            record_video.write(image)

        input_video.release()
        record_video.release()
        print(f"{basename_without_ext} has finished!")
