import os
import queue
import sys
from multiprocessing import Process, Queue

import sounddevice as sd
import vosk
import speech_recognition as sr
import subprocess


def voice_recognition_process(recognized_voice_queue: Queue, stt_api: str="Vosk") -> None:
    """
    _summary_

    Args:
        recognized_voice_queue (Queue):
        sst_type (str, optional): used Speech to Text API. should be "Vosk" or "speech_recognition". Defaults to "Vosk".
    """
    assert stt_api == "Vosk" or "speech_recognition", f"sst_type must be Vosk or speech_recognition"

    if stt_api == "Vosk":
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

    elif stt_api == "speech_recognition":
        r = sr.Recognizer()
        while True:
            with sr.Microphone() as source:
                r.adjust_for_ambient_noise(source)
                audio = r.listen(source)
            try:
                text = r.recognize_google(audio,language="ja-JP")
                recognized_voice_queue.put_nowait(text)
            except:
                pass

def get_recognized_voice(recognized_voice_queue: Queue):
    return recognized_voice_queue.get(block=False)

def did_recognize_word(target_word: str, voice_queue: Queue) -> bool:
    try:
        recognized_voice = get_recognized_voice(voice_queue)
        if target_word in recognized_voice:
            print(recognized_voice)
            return True
    except:
        pass
    return False
