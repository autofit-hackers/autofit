from ctypes import Union
from queue import Empty, Queue

from lib.webrtc_ui.display import text
from pynput import keyboard
import numpy as np


class KeyEventMonitor:

    def __init__(self):
        """
        キーイベントをnon-blockingで監視する
        how to use with mac: enable vscode accessibility and input monitoring.
        """
        self.key_queue = Queue()
        self.listener = keyboard.Listener(on_press=self._on_press, on_release=self._on_release)
        self.listener.start()

    def _on_press(self, key):
        try:
            self.key_queue.put_nowait(key.char)
        except AttributeError:
            pass

    def _on_release(self, key):
        pass

    def check_input(self, frame: np.ndarray):
        """
        VideoProcessorのframeに入力されたキーを描画する。
        アルファベット、数字は対応確認済み。特殊キーは未確認。

        Args:
            frame (np.ndarray): VideoProcessorのframe。shapeはカメラとwebrtcのパフォーマンスによって変動。
        """
        try:
            key_input = self.key_queue.get_nowait()
            text(frame, text=key_input, position=(0.9, 0.2), font_size=3)
        except Empty:
            pass

    def pressed(self, char: str) -> bool:
        try:
            key_input = self.key_queue.get_nowait()
            return char == key_input
        except Empty:
            return False

    def get_input_char(self) -> str:
        try:
            key_input = self.key_queue.get_nowait()
            return key_input
        except Empty:
            return ""

    def stop(self):
        self.listener.stop()
