import cv2 as cv
from utils import PoseLandmarksObject
import numpy as np


class ResetButton:
    def __init__(self, position=[10, 80], size=(50, 50), duration=50):
        self.position = position
        self.size = size
        self.duration = duration
        self.count = 0

    # called every frame
    def forward(self, frame, result_pose: PoseLandmarksObject, distance_thre=30):
        landmark_xy = result_pose.landmark[:, :2] * frame.shape
        distance = np.linalg.norm(landmark_xy[20] - self.position)

        if distance <= distance_thre:
            if self.count <= self.duration:
                self._add_count()
            else:
                self._reset_count
                return True
        else:
            self._reset_count()
        self._visualize(frame)

        return False

    def _add_count(self):
        self.count += 1
        if self.count >= self.duration:
            self._reset_count()

    def _reset_count(self):
        self.count = 0

    def _visualize(self, frame, color=(255, 255, 0)):
        cv.ellipse(
            img=frame,
            center=self.position,
            axes=self.size,
            angle=270,
            startAngle=0,
            endAngle=360 * (self.count / self.duration),
            color=color,
            lineType=cv.LINE_8,
            shift=0,
            thickness=-1,
        )
