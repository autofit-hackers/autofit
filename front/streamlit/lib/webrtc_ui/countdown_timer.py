from datetime import datetime
from typing import Tuple
import sys

sys.path.append("../../")
from pprint import pprint


import av
import cv2
import numpy as np
import numpy.typing as npt

from lib.webrtc_ui.display import text


class CountdownTimer(object):
    def __init__(self, remaining_time: float) -> None:
        """Countdown Timer

        Args:
            remaining_time (float): rest time to countdown (sec)
        """
        assert remaining_time > 0
        self.total_time = remaining_time
        self.remaining_time = remaining_time
        self.last_time = datetime.now()

    def _update(self) -> float:
        now_time = datetime.now()
        time_diff = (now_time - self.last_time).total_seconds()
        self.remaining_time -= time_diff
        self.last_time = now_time
        return self.remaining_time

    def _draw_arc(
        self, color: Tuple[int, int, int] = (255, 0, 0), radius: int = 90, width: int = 10, end_angle: int = 360
    ) -> npt.NDArray[np.uint8]:
        # ref. https://stackoverflow.com/questions/67168804/how-to-make-a-circular-countdown-timer-in-pygame
        circle_image: npt.NDArray[np.uint8] = (
            np.ones((radius * 2 + 4, radius * 2 + 4, 3), dtype=np.uint8) * 255
        ).astype(np.uint8)
        circle_image = cv2.ellipse(
            circle_image,
            (radius + 2, radius + 2),
            (radius - width // 2, radius - width // 2),
            0,
            0,
            end_angle,
            (*color, 255),
            width,
            lineType=cv2.LINE_AA,
        )
        return circle_image

    # def _draw_remaining_time(self, frame: npt.NDArray[np.uint8]):
    #     img = Image.fromarray(frame)
    #     img_shape = (img.height, img.width)
    #     draw = ImageDraw.Draw(img)
    #     draw.text(img_shape )

    #     cv2.putText(
    #         frame,
    #         f"Rest Timer: {timer_txt}",
    #         (0, 290),  # 画面左下に表示
    #         cv2.FONT_HERSHEY_SIMPLEX,
    #         1.0,
    #         (0, 0, 255),
    #         2,
    #         cv2.LINE_AA,
    #     )

    def draw(self) -> av.VideoFrame:
        self._update()
        frame: npt.NDArray[
            np.uint8
        ] = (
            self._draw_arc()
        )  # TODO: use radius from timer like `radius=int(self.remaining_time / self.total_time) * 360``
        timer_txt: str = f"{self.remaining_time:3.0f}"
        # timer_font = cv2.FONT_HERSHEY_SIMPLEX
        # TODO: use Pillow instead of cv2
        text(frame=frame, text=timer_txt, position=(0.5, 0.5), font_size=3, color_name="Blue", thickness=3)
        return frame


if __name__ == "__main__":
    timer = CountdownTimer(10)
    frame = timer.draw()
    cv2.imshow("hoge", frame)
    cv2.waitKey(0)
