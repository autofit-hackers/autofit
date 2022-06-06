from queue import Empty, Queue

import cv2
from lib.webrtc_ui.display import text
from pynput import keyboard


class KeyEventMonitor:
    def __init__(self):
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

    def check_input(self, frame):
        try:
            key_input = self.key_queue.get_nowait()
            text(frame, text=key_input, position=(0.9, 0.2), font_size=3)
        except Empty:
            pass

    def stop(self):
        self.listener.stop()
