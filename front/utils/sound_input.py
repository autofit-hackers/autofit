import os
import queue
import sys
from multiprocessing import Process, Queue

import sounddevice as sd
import vosk


def voice_recognition_process(recognized_voice_queue: Queue) -> None:
    model = vosk.Model("./data/ml_model/vosk-model-small-ja-0.22")
    device_id = 0
    device_info = sd.query_devices(device_id, "input")
    # soundfile expects an int, sounddevice provides a float:
    samplerate = int(device_info["default_samplerate"])
    microphone_queue = queue.Queue()

    def callback(indata, frames, time, status):
        """This is called (from a separate thread) for each audio block."""
        if status:
            print(status, file=sys.stderr)
        microphone_queue.put(bytes(indata))

    with sd.RawInputStream(
        samplerate=samplerate, blocksize=8000, device=device_id, dtype="int16", channels=1, callback=callback
    ):
        rec = vosk.KaldiRecognizer(model, samplerate)
        while True:
            data = microphone_queue.get()
            if rec.AcceptWaveform(data):
                recognized_voice_queue.put_nowait(rec.Result())
            else:
                pass


def get_recognized_voice(recognized_voice_queue: Queue):
    return recognized_voice_queue.get(block=False)
