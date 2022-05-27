import math
from turtle import color

import cv2 as cv2
import numpy as np

from .class_objects import PoseLandmarksObject
from typing import List


def draw_landmarks_pose(
    image,
    landmarks: PoseLandmarksObject,
    pose_color=(255, 0, 0),
    visibility_th: float = 0.5,
    show_z: bool = False,
    show_face_landmark: bool = False,
    circle_size=1,
):
    image_width, image_height = image.shape[1], image.shape[0]
    landmark_point = []

    """Keypointの描画"""
    num_joint: int = landmarks.landmark.shape[0]
    for index in range(num_joint):
        landmark = landmarks.landmark[index, :]
        landmark_x = min(int(landmark[0] * image_width), image_width - 1)
        landmark_y = min(int(landmark[1] * image_height), image_height - 1)
        landmark_z = landmark[2]
        landmark_point.append([landmarks.visibility[index], (landmark_x, landmark_y)])

        if landmarks.visibility[index] < visibility_th:
            continue
        if show_face_landmark:
            if index == 0:  # 鼻
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 1:  # 右目：目頭
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 2:  # 右目：瞳
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 3:  # 右目：目尻
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 4:  # 左目：目頭
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 5:  # 左目：瞳
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 6:  # 左目：目尻
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 7:  # 右耳
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 8:  # 左耳
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 9:  # 口：左端
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
            if index == 10:  # 口：左端
                cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 11:  # 右肩
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 12:  # 左肩
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 13:  # 右肘
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 14:  # 左肘
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 15:  # 右手首
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 16:  # 左手首
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 17:  # 右手1(外側端)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 18:  # 左手1(外側端)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 19:  # 右手2(先端)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 20:  # 左手2(先端)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 21:  # 右手3(内側端)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 22:  # 左手3(内側端)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 23:  # 腰(右側)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 24:  # 腰(左側)
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 25:  # 右ひざ
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 26:  # 左ひざ
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 27:  # 右足首
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 28:  # 左足首
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 29:  # 右かかと
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 30:  # 左かかと
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 31:  # 右つま先
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 32:  # 左つま先
            cv2.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)

        if show_z:
            cv2.putText(
                image,
                "z:" + str(round(landmark_z, 3)),
                (landmark_x - 10, landmark_y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                pose_color,
                1,
                cv2.LINE_AA,
            )

    """Keypointを結ぶLineの描画"""
    if show_face_landmark:
        # 右目
        if landmark_point[1][0] > visibility_th and landmark_point[2][0] > visibility_th:
            cv2.line(image, landmark_point[1][1], landmark_point[2][1], pose_color, 2)
        if landmark_point[2][0] > visibility_th and landmark_point[3][0] > visibility_th:
            cv2.line(image, landmark_point[2][1], landmark_point[3][1], pose_color, 2)

        # 左目
        if landmark_point[4][0] > visibility_th and landmark_point[5][0] > visibility_th:
            cv2.line(image, landmark_point[4][1], landmark_point[5][1], pose_color, 2)
        if landmark_point[5][0] > visibility_th and landmark_point[6][0] > visibility_th:
            cv2.line(image, landmark_point[5][1], landmark_point[6][1], pose_color, 2)

        # 口
        if landmark_point[9][0] > visibility_th and landmark_point[10][0] > visibility_th:
            cv2.line(image, landmark_point[9][1], landmark_point[10][1], pose_color, 2)

    # 肩
    if landmark_point[11][0] > visibility_th and landmark_point[12][0] > visibility_th:
        cv2.line(image, landmark_point[11][1], landmark_point[12][1], pose_color, 2)

    # 右腕
    if landmark_point[11][0] > visibility_th and landmark_point[13][0] > visibility_th:
        cv2.line(image, landmark_point[11][1], landmark_point[13][1], pose_color, 2)
    if landmark_point[13][0] > visibility_th and landmark_point[15][0] > visibility_th:
        cv2.line(image, landmark_point[13][1], landmark_point[15][1], pose_color, 2)

    # 左腕
    if landmark_point[12][0] > visibility_th and landmark_point[14][0] > visibility_th:
        cv2.line(image, landmark_point[12][1], landmark_point[14][1], pose_color, 2)
    if landmark_point[14][0] > visibility_th and landmark_point[16][0] > visibility_th:
        cv2.line(image, landmark_point[14][1], landmark_point[16][1], pose_color, 2)

    # 右手
    if landmark_point[15][0] > visibility_th and landmark_point[17][0] > visibility_th:
        cv2.line(image, landmark_point[15][1], landmark_point[17][1], pose_color, 2)
    if landmark_point[17][0] > visibility_th and landmark_point[19][0] > visibility_th:
        cv2.line(image, landmark_point[17][1], landmark_point[19][1], pose_color, 2)
    if landmark_point[19][0] > visibility_th and landmark_point[21][0] > visibility_th:
        cv2.line(image, landmark_point[19][1], landmark_point[21][1], pose_color, 2)
    if landmark_point[21][0] > visibility_th and landmark_point[15][0] > visibility_th:
        cv2.line(image, landmark_point[21][1], landmark_point[15][1], pose_color, 2)

    # 左手
    if landmark_point[16][0] > visibility_th and landmark_point[18][0] > visibility_th:
        cv2.line(image, landmark_point[16][1], landmark_point[18][1], pose_color, 2)
    if landmark_point[18][0] > visibility_th and landmark_point[20][0] > visibility_th:
        cv2.line(image, landmark_point[18][1], landmark_point[20][1], pose_color, 2)
    if landmark_point[20][0] > visibility_th and landmark_point[22][0] > visibility_th:
        cv2.line(image, landmark_point[20][1], landmark_point[22][1], pose_color, 2)
    if landmark_point[22][0] > visibility_th and landmark_point[16][0] > visibility_th:
        cv2.line(image, landmark_point[22][1], landmark_point[16][1], pose_color, 2)

    # 胴体
    if landmark_point[11][0] > visibility_th and landmark_point[23][0] > visibility_th:
        cv2.line(image, landmark_point[11][1], landmark_point[23][1], pose_color, 2)
    if landmark_point[12][0] > visibility_th and landmark_point[24][0] > visibility_th:
        cv2.line(image, landmark_point[12][1], landmark_point[24][1], pose_color, 2)
    if landmark_point[23][0] > visibility_th and landmark_point[24][0] > visibility_th:
        cv2.line(image, landmark_point[23][1], landmark_point[24][1], pose_color, 2)

    if len(landmark_point) > 25:
        # 右足
        if landmark_point[23][0] > visibility_th and landmark_point[25][0] > visibility_th:
            cv2.line(image, landmark_point[23][1], landmark_point[25][1], pose_color, 2)
        if landmark_point[25][0] > visibility_th and landmark_point[27][0] > visibility_th:
            cv2.line(image, landmark_point[25][1], landmark_point[27][1], pose_color, 2)
        if landmark_point[27][0] > visibility_th and landmark_point[29][0] > visibility_th:
            cv2.line(image, landmark_point[27][1], landmark_point[29][1], pose_color, 2)
        if landmark_point[29][0] > visibility_th and landmark_point[31][0] > visibility_th:
            cv2.line(image, landmark_point[29][1], landmark_point[31][1], pose_color, 2)

        # 左足
        if landmark_point[24][0] > visibility_th and landmark_point[26][0] > visibility_th:
            cv2.line(image, landmark_point[24][1], landmark_point[26][1], pose_color, 2)
        if landmark_point[26][0] > visibility_th and landmark_point[28][0] > visibility_th:
            cv2.line(image, landmark_point[26][1], landmark_point[28][1], pose_color, 2)
        if landmark_point[28][0] > visibility_th and landmark_point[30][0] > visibility_th:
            cv2.line(image, landmark_point[28][1], landmark_point[30][1], pose_color, 2)
        if landmark_point[30][0] > visibility_th and landmark_point[32][0] > visibility_th:
            cv2.line(image, landmark_point[30][1], landmark_point[32][1], pose_color, 2)

    return image


# デフォルトでは左足首の角度を描画
def draw_joint_angle_2d(
    image,
    pose_result: PoseLandmarksObject,
    three_joints: List[int] = [11, 23, 25],
    joint_color=(0, 0, 255),
    line_width=2,
):
    image_width, image_height = image.shape[1], image.shape[0]
    landmark = pose_result.landmark
    joint1 = landmark[three_joints[0], :2] * [image_width, image_height]
    joint2 = landmark[three_joints[1], :2] * [image_width, image_height]
    joint3 = landmark[three_joints[2], :2] * [image_width, image_height]
    vec1 = joint1 - joint2
    vec2 = joint3 - joint2

    joint_angles = []
    joint_angles.append(_calculate_vectors_angle_2d(vec1, vec2))

    for joint_angle in joint_angles:
        radius = int(np.linalg.norm(vec2) / 3)
        x_unit_vec = np.array([1, 0])
        base_angle = _calculate_vectors_angle_2d(vec1, x_unit_vec)
        # cv2.ellipse(
        #     img=image,
        #     center=(int(joint2[0]), int(joint2[1])),
        #     axes=(radius, radius),
        #     angle=-1 * base_angle,
        #     startAngle=0,
        #     endAngle=joint_angle,
        #     color=joint_color,
        #     thickness=1,
        #     lineType=cv2.LINE_8,
        #     shift=0,
        # )
        cv2.putText(
            img=image,
            text=f"{int(joint_angle)} deg",
            org=joint2.astype(int) + 5,
            fontFace=cv2.FONT_HERSHEY_SIMPLEX,
            fontScale=0.5,
            color=joint_color,
            thickness=2,
            lineType=cv2.LINE_4,
        )
        cv2.line(image, ((joint1 + joint2) / 2).astype(int), joint2.astype(int), joint_color, line_width)
        cv2.line(image, joint2.astype(int), ((joint2 + joint3) / 2).astype(int), joint_color, line_width)

    return image


def _calculate_vectors_angle_2d(vec1, vec2):
    vec1_norm = np.linalg.norm(vec1)
    vec2_norm = np.linalg.norm(vec2)

    inner_product = np.inner(vec1, vec2)
    cos = inner_product / (vec1_norm * vec2_norm)
    # 角度（ラジアン）の計算
    rad = np.arccos(cos)
    # 弧度法から度数法（rad ➔ 度）への変換
    degree = np.rad2deg(rad)

    return degree
