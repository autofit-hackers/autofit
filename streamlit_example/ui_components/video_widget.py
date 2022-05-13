import cv2 as cv
from utils import PoseLandmarksObject
import numpy as np


class ResetButton:
    def __init__(self, center=[50, 140], size=50, duration=30):
        self.center = center
        self.size = size
        self.duration = duration
        self.count = 0
        self.should_reset = False

    def is_pressed(self, frame, result_pose: PoseLandmarksObject):
        landmark_xy = result_pose.landmark[:, :2] * frame.shape[:2]
        distance = np.linalg.norm(landmark_xy[20] - self.center)
        if distance <= self.size:
            if self.count >= self.duration:
                self._reset_count()
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
    def visualize(self, frame, color=(255, 255, 0)):
        cv.circle(frame, self.center, self.size, color, thickness=1, lineType=cv.LINE_8, shift=0)
        cv.ellipse(
            img=frame,
            center=self.center,
            axes=(self.size, self.size),
            angle=270,
            startAngle=0,
            endAngle=360 * (self.count / self.duration),
            color=color,
            lineType=cv.LINE_8,
            shift=0,
            thickness=-1,
        )
