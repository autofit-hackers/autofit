import cv2
from utils import PoseLandmarksObject
import numpy as np


class ResetButton:
    def __init__(self, center=[50, 120], size=40, duration=30):
        self.center = center
        self.size = size
        self.duration = duration
        self.count = 0
        self.should_reset = False
        self.wait_count = 0

    def is_pressed(self, frame, result_pose: PoseLandmarksObject):
        landmark_xy = result_pose.landmark[:, :2] * np.array([frame.shape[1], frame.shape[0]])
        distance = np.linalg.norm(landmark_xy[20] - self.center)
        if distance < self.size:
            if self.count == self.duration:
                self._reset_count()
                self._wait_start()
                return True
            else:
                self._add_count()
        else:
            self._reset_count()

        return False

    def _add_count(self):
        self.count += 1
        if self.count > self.duration:
            self._reset_count()

    def _reset_count(self):
        self.count = 0

    # called every frame
    def visualize(self, frame, color_ing=(255, 255, 0), color_ed=(0, 255, 255), text="Start"):
        if self.is_waiting():
            cv2.circle(frame, self.center, self.size, color_ed, thickness=3, lineType=cv2.LINE_8, shift=0)
            cv2.putText(
                frame,
                text,
                [self.center[0] - 25, self.center[1] + 5],
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color_ed,
                1,
                cv2.LINE_AA,
            )
        else:
            cv2.circle(frame, self.center, self.size, color_ing, thickness=3, lineType=cv2.LINE_8, shift=0)
            if self.count > 0:
                cv2.ellipse(
                    img=frame,
                    center=self.center,
                    axes=(self.size, self.size),
                    angle=270,
                    startAngle=0,
                    endAngle=360 * (self.count / self.duration),
                    color=color_ed,
                    lineType=cv2.LINE_8,
                    shift=0,
                    thickness=3,
                )
            cv2.putText(
                frame,
                text,
                [self.center[0] - 25, self.center[1] + 5],
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color_ing,
                1,
                cv2.LINE_AA,
            )

    def _wait_start(self):
        self.wait_count = 60

    def is_waiting(self) -> bool:
        if self.wait_count > 0:
            self.wait_count -= 1
            self.count = 0
            return True
        else:
            return False

    def calcurate_text_center(self, text, center, font=cv2.FONT_HERSHEY_SIMPLEX, font_scale=1.0, thickness=1):
        # get boundary of this text
        textsize = cv2.getTextSize(text, font, font_scale, thickness)[0]

        # get coordinates based on boundary
        textX = (center[1] - textsize[0]) / 2
        textY = (center[0] + textsize[1]) / 2

        return [textX, textY]


class CircleHoldButton:
    def __init__(self, center=[50, 120], size=40, duration=30):
        self.center = center
        self.size = size
        self.duration = duration
        self.count = 0
        self.should_reset = False
        self.wait_count = 0

    def is_pressed(self, frame, result_pose: PoseLandmarksObject):
        landmark_xy = result_pose.landmark[:, :2] * np.array([frame.shape[1], frame.shape[0]])
        distance = np.linalg.norm(landmark_xy[20] - self.center)
        if distance < self.size:
            if self.count == self.duration:
                self._reset_count()
                self._wait_start()
                return True
            else:
                self._add_count()
        else:
            self._reset_count()

        return False

    def _add_count(self):
        self.count += 1
        if self.count > self.duration:
            self._reset_count()

    def _reset_count(self):
        self.count = 0

    def update(self, frame, text="Start", color_ing=(255, 255, 0), color_ed=(0, 255, 255)):
        if self._is_waiting():
            cv2.circle(frame, self.center, self.size, color_ed, thickness=3, lineType=cv2.LINE_8, shift=0)
            cv2.putText(
                frame,
                text,
                [self.center[0] - 25, self.center[1] + 5],
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color_ed,
                1,
                cv2.LINE_AA,
            )
        else:
            cv2.circle(frame, self.center, self.size, color_ing, thickness=3, lineType=cv2.LINE_8, shift=0)
            if self.count > 0:
                cv2.ellipse(
                    img=frame,
                    center=self.center,
                    axes=(self.size, self.size),
                    angle=270,
                    startAngle=0,
                    endAngle=360 * (self.count / self.duration),
                    color=color_ed,
                    lineType=cv2.LINE_8,
                    shift=0,
                    thickness=3,
                )
            cv2.putText(
                frame,
                text,
                [self.center[0] - 25, self.center[1] + 5],
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color_ing,
                1,
                cv2.LINE_AA,
            )

    def _wait_start(self):
        self.wait_count = 60

    def _is_waiting(self) -> bool:
        if self.wait_count > 0:
            self.wait_count -= 1
            self.count = 0
            return True
        else:
            return False

    def _calcurate_text_center(self, text, center, font=cv2.FONT_HERSHEY_SIMPLEX, font_scale=1.0, thickness=1):
        # get boundary of this text
        textsize = cv2.getTextSize(text, font, font_scale, thickness)[0]

        # get coordinates based on boundary
        textX = (center[1] - textsize[0]) / 2
        textY = (center[0] + textsize[1]) / 2

        return [textX, textY]
