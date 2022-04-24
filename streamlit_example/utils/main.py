#!/usr/bin/env python
# -*- coding: utf-8 -*-
import argparse
import copy
import math

import cv2 as cv
import mediapipe as mp
import numpy as np
from streamlit_example.utils.draw_pose import draw_landmarks, draw_stick_figure

from calculate_fps import FpsCalculator


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--device", type=int, default=0)
    parser.add_argument("--width", help="cap width", type=int, default=640)
    parser.add_argument("--height", help="cap height", type=int, default=360)

    parser.add_argument("--static_image_mode", action="store_true")
    parser.add_argument("--model_complexity", help="model_complexity(0,1(default),2)", type=int, default=1)
    parser.add_argument("--min_detection_confidence", help="min_detection_confidence", type=float, default=0.5)
    parser.add_argument("--min_tracking_confidence", help="min_tracking_confidence", type=int, default=0.5)

    parser.add_argument("--rev_color", action="store_true")

    args = parser.parse_args()

    return args


def main():
    # 引数解析 #################################################################
    args = get_args()

    cap_device = args.device
    cap_width = args.width
    cap_height = args.height

    static_image_mode = args.static_image_mode
    model_complexity = args.model_complexity
    min_detection_confidence = args.min_detection_confidence
    min_tracking_confidence = args.min_tracking_confidence

    rev_color = args.rev_color

    # カメラ準備 ###############################################################
    cap = cv.VideoCapture(cap_device)
    cap.set(cv.CAP_PROP_FRAME_WIDTH, cap_width)
    cap.set(cv.CAP_PROP_FRAME_HEIGHT, cap_height)

    # モデルロード #############################################################
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=static_image_mode,
        model_complexity=model_complexity,
        min_detection_confidence=min_detection_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )

    # FPS計測モジュール ########################################################
    cvFpsCalc = FpsCalculator(buffer_len=10)

    # 色指定
    if rev_color:
        color = (255, 255, 255)
        bg_color = (100, 33, 3)
    else:
        color = (100, 33, 3)
        bg_color = (255, 255, 255)

    while True:
        display_fps = cvFpsCalc.get()

        # カメラキャプチャ #####################################################
        ret, image = cap.read()
        if not ret:
            break
        image = cv.flip(image, 1)  # ミラー表示
        debug_image01 = copy.deepcopy(image)
        debug_image02 = np.zeros((image.shape[0], image.shape[1], 3), np.uint8)
        cv.rectangle(debug_image02, (0, 0), (image.shape[1], image.shape[0]), bg_color, thickness=-1)

        # 検出実施 #############################################################
        image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
        results = pose.process(image)

        # 描画 ################################################################
        if results.pose_landmarks is not None:
            # 描画
            debug_image01 = draw_landmarks(
                debug_image01,
                results.pose_landmarks,
            )
            debug_image02 = draw_stick_figure(
                debug_image02,
                results.pose_landmarks,
                color=color,
                bg_color=bg_color,
            )

        cv.putText(
            debug_image01,
            "FPS:" + str(display_fps),
            (10, 30),
            cv.FONT_HERSHEY_SIMPLEX,
            1.0,
            color,
            2,
            cv.LINE_AA,
        )
        cv.putText(
            debug_image02, "FPS:" + str(display_fps), (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1.0, color, 2, cv.LINE_AA
        )

        # キー処理(ESC：終了) #################################################
        key = cv.waitKey(1)
        if key == 27:  # ESC
            break

        # 画面反映 #############################################################
        cv.imshow("Tokyo2020 Debug", debug_image01)
        cv.imshow("Tokyo2020 Pictogram", debug_image02)

    cap.release()
    cv.destroyAllWindows()


if __name__ == "__main__":
    main()
