import math
from turtle import color

import cv2 as cv
import numpy as np

from .class_objects import PoseLandmarksObject
from typing import List


def draw_stick_figure(
    image,
    landmarks,
    color=(100, 33, 3),
    bg_color=(255, 255, 255),
    visibility_th=0.5,
):
    image_width, image_height = image.shape[1], image.shape[0]

    # 各ランドマーク算出
    landmark_point = []
    for index, landmark in enumerate(landmarks.landmark):
        landmark_x = min(int(landmark.x * image_width), image_width - 1)
        landmark_y = min(int(landmark.y * image_height), image_height - 1)
        landmark_z = landmark.z
        landmark_point.append([index, landmark.visibility, (landmark_x, landmark_y), landmark_z])

    # 脚の付け根の位置を腰の中点に修正
    right_leg = landmark_point[23]
    left_leg = landmark_point[24]
    leg_x = int((right_leg[2][0] + left_leg[2][0]) / 2)
    leg_y = int((right_leg[2][1] + left_leg[2][1]) / 2)

    landmark_point[23][2] = (leg_x, leg_y)
    landmark_point[24][2] = (leg_x, leg_y)

    # 距離順にソート
    sorted_landmark_point = sorted(landmark_point, reverse=True, key=lambda x: x[3])

    # 各サイズ算出
    (face_x, face_y), face_radius = min_enclosing_face_circle(landmark_point)

    face_x = int(face_x)
    face_y = int(face_y)
    face_radius = int(face_radius * 1.5)

    stick_radius01 = int(face_radius * (4 / 5))
    stick_radius02 = int(stick_radius01 * (3 / 4))
    stick_radius03 = int(stick_radius02 * (3 / 4))

    # 描画対象リスト
    draw_list = [
        11,  # 右腕
        12,  # 左腕
        23,  # 右脚
        24,  # 左脚
    ]

    # 背景色
    cv.rectangle(image, (0, 0), (image_width, image_height), bg_color, thickness=-1)

    # 顔 描画
    cv.circle(image, (face_x, face_y), face_radius, color, -1)

    # 腕/脚 描画
    for landmark_info in sorted_landmark_point:
        index = landmark_info[0]

        if index in draw_list:
            point01 = [p for p in landmark_point if p[0] == index][0]
            point02 = [p for p in landmark_point if p[0] == (index + 2)][0]
            point03 = [p for p in landmark_point if p[0] == (index + 4)][0]

            if point01[1] > visibility_th and point02[1] > visibility_th:
                image = draw_stick(
                    image,
                    point01[2],
                    stick_radius01,
                    point02[2],
                    stick_radius02,
                    color=color,
                    bg_color=bg_color,
                )
            if point02[1] > visibility_th and point03[1] > visibility_th:
                image = draw_stick(
                    image,
                    point02[2],
                    stick_radius02,
                    point03[2],
                    stick_radius03,
                    color=color,
                    bg_color=bg_color,
                )

    return image


def min_enclosing_face_circle(landmark_point):
    landmark_array = np.empty((0, 2), int)

    index_list = [1, 4, 7, 8, 9, 10]
    for index in index_list:
        np_landmark_point = [np.array((landmark_point[index][2][0], landmark_point[index][2][1]))]
        landmark_array = np.append(landmark_array, np_landmark_point, axis=0)

    center, radius = cv.minEnclosingCircle(points=landmark_array)

    return center, radius


def draw_stick(
    image,
    point01,
    point01_radius,
    point02,
    point02_radius,
    color=(100, 33, 3),
    bg_color=(255, 255, 255),
):
    cv.circle(image, point01, point01_radius, color, -1)
    cv.circle(image, point02, point02_radius, color, -1)

    draw_list = []
    for index in range(2):
        rad = math.atan2(point02[1] - point01[1], point02[0] - point01[0])

        rad = rad + (math.pi / 2) + (math.pi * index)
        point_x = int(point01_radius * math.cos(rad)) + point01[0]
        point_y = int(point01_radius * math.sin(rad)) + point01[1]

        draw_list.append([point_x, point_y])

        point_x = int(point02_radius * math.cos(rad)) + point02[0]
        point_y = int(point02_radius * math.sin(rad)) + point02[1]

        draw_list.append([point_x, point_y])

    points = np.array((draw_list[0], draw_list[1], draw_list[3], draw_list[2]))
    cv.fillConvexPoly(image, points=points, color=color)

    return image


def draw_landmarks_pose(
    image,
    landmarks: PoseLandmarksObject,
    pose_color=(255, 0, 0),
    visibility_th: float = 0.5,
    show_z: bool = True,
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

        if index == 0:  # 鼻
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 1:  # 右目：目頭
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 2:  # 右目：瞳
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 3:  # 右目：目尻
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 4:  # 左目：目頭
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 5:  # 左目：瞳
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 6:  # 左目：目尻
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 7:  # 右耳
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 8:  # 左耳
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 9:  # 口：左端
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 10:  # 口：左端
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 11:  # 右肩
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 12:  # 左肩
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 13:  # 右肘
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 14:  # 左肘
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 15:  # 右手首
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 16:  # 左手首
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 17:  # 右手1(外側端)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 18:  # 左手1(外側端)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 19:  # 右手2(先端)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 20:  # 左手2(先端)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 21:  # 右手3(内側端)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 22:  # 左手3(内側端)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 23:  # 腰(右側)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 24:  # 腰(左側)
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 25:  # 右ひざ
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 26:  # 左ひざ
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 27:  # 右足首
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 28:  # 左足首
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 29:  # 右かかと
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 30:  # 左かかと
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 31:  # 右つま先
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)
        if index == 32:  # 左つま先
            cv.circle(image, (landmark_x, landmark_y), 5, pose_color, circle_size)

        if show_z:
            cv.putText(
                image,
                "z:" + str(round(landmark_z, 3)),
                (landmark_x - 10, landmark_y - 10),
                cv.FONT_HERSHEY_SIMPLEX,
                0.5,
                pose_color,
                1,
                cv.LINE_AA,
            )

    """Keypointを結ぶLineの描画"""
    # 右目
    if landmark_point[1][0] > visibility_th and landmark_point[2][0] > visibility_th:
        cv.line(image, landmark_point[1][1], landmark_point[2][1], pose_color, 2)
    if landmark_point[2][0] > visibility_th and landmark_point[3][0] > visibility_th:
        cv.line(image, landmark_point[2][1], landmark_point[3][1], pose_color, 2)

    # 左目
    if landmark_point[4][0] > visibility_th and landmark_point[5][0] > visibility_th:
        cv.line(image, landmark_point[4][1], landmark_point[5][1], pose_color, 2)
    if landmark_point[5][0] > visibility_th and landmark_point[6][0] > visibility_th:
        cv.line(image, landmark_point[5][1], landmark_point[6][1], pose_color, 2)

    # 口
    if landmark_point[9][0] > visibility_th and landmark_point[10][0] > visibility_th:
        cv.line(image, landmark_point[9][1], landmark_point[10][1], pose_color, 2)

    # 肩
    if landmark_point[11][0] > visibility_th and landmark_point[12][0] > visibility_th:
        cv.line(image, landmark_point[11][1], landmark_point[12][1], pose_color, 2)

    # 右腕
    if landmark_point[11][0] > visibility_th and landmark_point[13][0] > visibility_th:
        cv.line(image, landmark_point[11][1], landmark_point[13][1], pose_color, 2)
    if landmark_point[13][0] > visibility_th and landmark_point[15][0] > visibility_th:
        cv.line(image, landmark_point[13][1], landmark_point[15][1], pose_color, 2)

    # 左腕
    if landmark_point[12][0] > visibility_th and landmark_point[14][0] > visibility_th:
        cv.line(image, landmark_point[12][1], landmark_point[14][1], pose_color, 2)
    if landmark_point[14][0] > visibility_th and landmark_point[16][0] > visibility_th:
        cv.line(image, landmark_point[14][1], landmark_point[16][1], pose_color, 2)

    # 右手
    if landmark_point[15][0] > visibility_th and landmark_point[17][0] > visibility_th:
        cv.line(image, landmark_point[15][1], landmark_point[17][1], pose_color, 2)
    if landmark_point[17][0] > visibility_th and landmark_point[19][0] > visibility_th:
        cv.line(image, landmark_point[17][1], landmark_point[19][1], pose_color, 2)
    if landmark_point[19][0] > visibility_th and landmark_point[21][0] > visibility_th:
        cv.line(image, landmark_point[19][1], landmark_point[21][1], pose_color, 2)
    if landmark_point[21][0] > visibility_th and landmark_point[15][0] > visibility_th:
        cv.line(image, landmark_point[21][1], landmark_point[15][1], pose_color, 2)

    # 左手
    if landmark_point[16][0] > visibility_th and landmark_point[18][0] > visibility_th:
        cv.line(image, landmark_point[16][1], landmark_point[18][1], pose_color, 2)
    if landmark_point[18][0] > visibility_th and landmark_point[20][0] > visibility_th:
        cv.line(image, landmark_point[18][1], landmark_point[20][1], pose_color, 2)
    if landmark_point[20][0] > visibility_th and landmark_point[22][0] > visibility_th:
        cv.line(image, landmark_point[20][1], landmark_point[22][1], pose_color, 2)
    if landmark_point[22][0] > visibility_th and landmark_point[16][0] > visibility_th:
        cv.line(image, landmark_point[22][1], landmark_point[16][1], pose_color, 2)

    # 胴体
    if landmark_point[11][0] > visibility_th and landmark_point[23][0] > visibility_th:
        cv.line(image, landmark_point[11][1], landmark_point[23][1], pose_color, 2)
    if landmark_point[12][0] > visibility_th and landmark_point[24][0] > visibility_th:
        cv.line(image, landmark_point[12][1], landmark_point[24][1], pose_color, 2)
    if landmark_point[23][0] > visibility_th and landmark_point[24][0] > visibility_th:
        cv.line(image, landmark_point[23][1], landmark_point[24][1], pose_color, 2)

    if len(landmark_point) > 25:
        # 右足
        if landmark_point[23][0] > visibility_th and landmark_point[25][0] > visibility_th:
            cv.line(image, landmark_point[23][1], landmark_point[25][1], pose_color, 2)
        if landmark_point[25][0] > visibility_th and landmark_point[27][0] > visibility_th:
            cv.line(image, landmark_point[25][1], landmark_point[27][1], pose_color, 2)
        if landmark_point[27][0] > visibility_th and landmark_point[29][0] > visibility_th:
            cv.line(image, landmark_point[27][1], landmark_point[29][1], pose_color, 2)
        if landmark_point[29][0] > visibility_th and landmark_point[31][0] > visibility_th:
            cv.line(image, landmark_point[29][1], landmark_point[31][1], pose_color, 2)

        # 左足
        if landmark_point[24][0] > visibility_th and landmark_point[26][0] > visibility_th:
            cv.line(image, landmark_point[24][1], landmark_point[26][1], pose_color, 2)
        if landmark_point[26][0] > visibility_th and landmark_point[28][0] > visibility_th:
            cv.line(image, landmark_point[26][1], landmark_point[28][1], pose_color, 2)
        if landmark_point[28][0] > visibility_th and landmark_point[30][0] > visibility_th:
            cv.line(image, landmark_point[28][1], landmark_point[30][1], pose_color, 2)
        if landmark_point[30][0] > visibility_th and landmark_point[32][0] > visibility_th:
            cv.line(image, landmark_point[30][1], landmark_point[32][1], pose_color, 2)

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
        # cv.ellipse(
        #     img=image,
        #     center=(int(joint2[0]), int(joint2[1])),
        #     axes=(radius, radius),
        #     angle=-1 * base_angle,
        #     startAngle=0,
        #     endAngle=joint_angle,
        #     color=joint_color,
        #     thickness=1,
        #     lineType=cv.LINE_8,
        #     shift=0,
        # )
        cv.putText(
            img=image,
            text=f"{int(joint_angle)} deg",
            org=joint2.astype(int) + 5,
            fontFace=cv.FONT_HERSHEY_SIMPLEX,
            fontScale=0.5,
            color=joint_color,
            thickness=2,
            lineType=cv.LINE_4,
        )
        cv.line(image, joint1.astype(int), joint2.astype(int), joint_color, line_width)
        cv.line(image, joint2.astype(int), joint3.astype(int), joint_color, line_width)

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
