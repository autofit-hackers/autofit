from queue import Queue, Empty
import sys
from multiprocessing import Process, Queue

import sounddevice as sd
import speech_recognition as sr
import vosk


class VoiceRecognitionProcess(Process):
    def __init__(self, stt_api: str = "vosk", device_id: int = 0):
        """
        Args:
            stt_api (str, optional): used Speech to Text API. Should be "vosk"(default) or "sr".
        """
        super(VoiceRecognitionProcess, self).__init__()
        self._stt_api = stt_api
        self.device_id = device_id
        self._recognized_voice_queue = Queue()

    def run(self):
        """
        automatically executed when the process starts
        """
        assert self._stt_api == "vosk" or "sr", "stt_api must be vosk or speech_recognition"

        if self._stt_api == "vosk":
            self._run_recognizer_with_vosk()

        elif self._stt_api == "sr":
            self._run_recognizer_with_sr()

    def _run_recognizer_with_vosk(self):
        model = vosk.Model("./data/ml_model/vosk-model-small-ja-0.22")
        device_id = self.device_id
        device_info = sd.query_devices(device_id, "input")
        # soundfile expects an int, sounddevice provides a float:
        samplerate = int(device_info["default_samplerate"])
        microphone_queue = Queue()

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
                    self._recognized_voice_queue.put_nowait(rec.Result())
                else:
                    pass

    def _run_recognizer_with_sr(self):
        r = sr.Recognizer()
        while True:
            with sr.Microphone() as source:
                r.adjust_for_ambient_noise(source)
                audio = r.listen(source)
            try:
                text = r.recognize_google(audio, language="ja-JP")
                self._recognized_voice_queue.put_nowait(text)
            except:
                pass

    def is_recognized_as(self, keyword: str):
        try:
            recognized_voice = self._get_recognized_voice()
            if keyword in recognized_voice:
                print(recognized_voice)
                return True
        except Empty:
            pass
        return False

    def _get_recognized_voice(self):
        recognized_voice = self._recognized_voice_queue.get_nowait()
        return recognized_voice
