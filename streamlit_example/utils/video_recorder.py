from typing import Callable

from aiortc.contrib.media import MediaRecorder

def gen_in_recorder_factory(video_save_path: str) -> Callable[[], MediaRecorder]:
    # assert Path(video_save_path).parent.exists() and Path(video_save_path).parent.is_dir()
    return lambda: MediaRecorder(video_save_path, format="mp4")