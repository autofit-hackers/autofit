from datetime import datetime

import av
import cv2


class CountdownTimer(object):
    def __init__(self, remaining_time: float) -> None:
        """Countdown Timer

        Args:
            remaining_time (float): rest time to countdown (sec)
        """
        assert remaining_time > 0
        self.remaining_time = remaining_time
        self.last_time = datetime.now()

    def _update(self) -> float:
        now_time = datetime.now()
        time_diff = (now_time - self.last_time).total_seconds()
        self.remaining_time -= time_diff
        self.last_time = now_time
        return self.remaining_time

    def draw(self, frame: av.VideoFrame) -> av.VideoFrame:
        """Draw remaining time on a frame

        Args:
            frame (av.VideoFrame): frame to draw remaining time on

        Returns:
            av.VideoFrame: editted frame
        """
        self._update()
        timer_txt: str = f"{self.remaining_time:3.0f}s"
        # TODO: use Pillow instead of cv2
        cv2.putText(
            frame,
            f"Rest Timer: {timer_txt}",
            (0, 290),  # 画面左下に表示
            cv2.FONT_HERSHEY_SIMPLEX,
            1.0,
            (0, 0, 255),
            2,
            cv2.LINE_AA,
        )
        return frame
