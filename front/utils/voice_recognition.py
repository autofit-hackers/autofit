import os
import queue
import subprocess
import sys
from multiprocessing import Process, Queue

import sounddevice as sd
import speech_recognition as sr
import vosk


class VoiceRecognitionProcess(Process):

    def __init__(self, stt_api: str="Vosk"):
        """
        Args:
            stt_api (str, optional): Sppech to Text API. should be "Vosk" or "sr". Defaults to "Vosk".
        """
        assert stt_api == "Vosk" or "sr", f"stt_api must be Vosk or speech_recognition"
        super(VoiceRecognitionProcess, self).__init__()
        self.stt_api = stt_api

    def run(self, out_queue :Queue):
        if self.stt_api == "Vosk":
            model = vosk.Model("./data/ml_model/vosk-model-small-ja-0.22")
            device_id = 0
            device_info = sd.query_devices(device_id, "input")
            # soundfile expects an int, sounddevice provides a float:
            samplerate = int(device_info["default_samplerate"])
            _microphone_queue = queue.Queue()

            def callback(indata, frames, time, status):
                """This is called (from a separate thread) for each audio block."""
                if status:
                    print(status, file=sys.stderr)
                _microphone_queue.put(bytes(indata))

            with sd.RawInputStream(
                samplerate=samplerate, blocksize=8000, device=device_id, dtype="int16", channels=1, callback=callback
            ):
                rec = vosk.KaldiRecognizer(model, samplerate)
                while True:
                    data = _microphone_queue.get()
                    if rec.AcceptWaveform(data):
                        out_queue.put_nowait(rec.Result())
                    else:
                        pass

        elif self.stt_api == "sr":
            r = sr.Recognizer()
            while True:
                with sr.Microphone() as source:
                    r.adjust_for_ambient_noise(source)
                    audio = r.listen(source)
                try:
                    text = r.recognize_google(audio,language="ja-JP")
                    out_queue.put_nowait(text)
                except:
                    pass

    def is_recognized_as(self, keyword :str, out_queue: Queue):
        try:
            recognized_voice = self._get_recognized_voice(out_queue)
            if keyword in recognized_voice:
                print(recognized_voice)
                return True
        except:
            pass
        return False

    def _get_recognized_voice(self, out_queue: Queue):
        return out_queue.get_nowait()
