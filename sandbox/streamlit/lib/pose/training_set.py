from dataclasses import dataclass, field
import os
from typing import List
from gtts import gTTS

import numpy as np
import pandas as pd
from playsound import playsound
from utils.class_objects import PoseLandmarksObject


class TrainingObject:
    def __init__(self, user_id: str) -> None:
        self.user_id = user_id
        self.sets: List[SetObject] = []

    def make_new_set(self) -> None:
        self.sets.append(SetObject(menu="menu", weight=60))


class SetObject:
    def __init__(self, menu: str, weight: int):
        self.reps: List[RepObject] = []
        self.menu: str = menu
        self.weight: float = weight

    def make_new_rep(self) -> None:
        """新しいRepObjectを作成し、配列に追加する"""
        idx = len(self.reps) + 1
        self.reps.append(RepObject(idx))


class RepObject:
    """Key Frame は ["top", "descending_middle", "bottom", "ascending_middle"]"""

    def __init__(self, rep_number: int) -> None:
        """
        Args:
            rep_number (int): start from 1
        """
        self.poses = []
        self.body_heights: List[float] = []
        self.keyframes: dict = {}
        self.rep_number = rep_number

    def record_pose(self, pose: PoseLandmarksObject):
        self.poses.append(pose)
        # self.body_heights.append(pose.get_2d_height())

    def reset(self, rep_number):
        self.poses: List[PoseLandmarksObject] = []
        self.keyframes: dict = {}
        self.rep_number: int = rep_number

    def recalculate_keyframes(self) -> dict:
        """それまでに溜まっているレップ中のフレーム情報からKeyFrameを算出

        Returns:
            dict: keys = ["top", "descending_middle", "bottom", "ascending_middle"]
        """
        self.body_heights = [float(pose.get_2d_height()) for pose in self.poses]
        # calculate top
        top_height = max(self.body_heights)
        top_idx = self.body_heights.index(top_height)
        self.keyframes["top"] = top_idx

        # calculate bottom
        bottom_height = min(self.body_heights)
        bottom_idx = self.body_heights.index(bottom_height)
        self.keyframes["bottom"] = bottom_idx

        # top should be before bottom
        if top_idx < bottom_idx:
            middle_height = (top_height + bottom_height) / 2

            # calculate descending_middle
            descending_middle_idx = top_idx
            while self.body_heights[descending_middle_idx] > middle_height:
                descending_middle_idx += 1
            self.keyframes["descending_middle"] = descending_middle_idx

            # calculate ascending_middle
            ascending_middle_idx = bottom_idx
            while (
                self.body_heights[ascending_middle_idx] < middle_height
                and ascending_middle_idx < len(self.body_heights) - 1
            ):
                ascending_middle_idx += 1
            self.keyframes["ascending_middle"] = ascending_middle_idx

        return self.keyframes

    def calculate_velocity(self) -> pd.DataFrame:
        """
        velocity = self.tmp_body_heights[9] - self.tmp_body_heights[0]
        self.body_heights_df = pd.concat(
            [self.body_heights_df, pd.DataFrame({"time": [time.time()], "height": [height], "velocity": [velocity]})],
            ignore_index=True,
        )

        Returns:
            pd.DataFrame: time, height, velocityの入ったdataframeを返す
        """
        return pd.DataFrame([])

    def get_keyframe_pose(self, key: str):
        return self.poses[self.keyframes["bottom"]]


@dataclass
class RepState:
    """
    刹那的にrepの状態を見守るクラス
    """

    rep_count: int = 0
    is_lifting_up = False
    did_touch_bottom = False
    did_touch_top = True
    initial_body_height = 0
    tmp_body_heights: List[np.double] = field(default_factory=list)

    body_heights_df: pd.DataFrame = pd.DataFrame(columns=["time", "height", "velocity"])

    def _init_rep(self, height: np.double):
        self.initial_body_height = height
        self.tmp_body_heights = [self.initial_body_height] * 10

    def update_rep_count(self, pose: PoseLandmarksObject, lower_thre, upper_thre) -> bool:
        """repが+1された時、Trueを返す

        Args:
            pose (PoseLandmarksObject): その瞬間のpose
            lower_thre (_type_): _description_
            upper_thre (_type_): _description_

        Returns:
            bool: repの+1タイミングでTrue
        """
        height = pose.get_2d_height()
        if len(self.tmp_body_heights) < 10:
            self._init_rep(height=height)
        has_count_upped = self._check_if_rep_finished(height=height, lower_thre=lower_thre, upper_thre=upper_thre)

        self._update_lifting_state(height=height)

        return has_count_upped

    # HACK: 上のメソッドと役割が被っている
    def _check_if_rep_finished(self, height: np.double, lower_thre, upper_thre):
        if not self.did_touch_bottom and height < self.initial_body_height * lower_thre:
            self.did_touch_bottom = True
        elif self.did_touch_bottom and height > self.initial_body_height * upper_thre:
            self.rep_count += 1
            self.did_touch_bottom = False
            return True
        return False

    def _update_lifting_state(self, height: np.double):
        self.tmp_body_heights.pop(0)
        self.tmp_body_heights.append(height)

    def play_rep_sound(self):
        # 音声ファイルが存在しない場合は合成音声ライブラリで作成する
        if not os.path.isfile(f"data/audio_src/rep_count/{self.rep_count}.mp3"):
            gTTS(text=str(self.rep_count), lang="ja", slow=False).save(f"data/audio_src/rep_count/{self.rep_count}.mp3")

        sound_file = f"data/audio_src/rep_count/{self.rep_count}.mp3"
        playsound(sound_file, block=False)

    def is_keyframe(self, pose: PoseLandmarksObject, lower_thre=0.96, upper_thre=0.97):
        height = pose.get_2d_height()
        if self.did_touch_top and height < self.initial_body_height * lower_thre:
            self.did_touch_top = False
            return True
        elif not self.did_touch_top and height > self.initial_body_height * upper_thre:
            self.did_touch_top = True
            return False
        else:
            return False

    def reset_rep(self, pose: PoseLandmarksObject):
        self.rep_count: int = 0
        self.is_lifting_up = False
        self.did_touch_bottom = False
        self.did_touch_top = True
        self.initial_body_height = pose.get_2d_height()
        self.tmp_body_heights = [self.initial_body_height] * 10

        self.body_heights_df = pd.DataFrame(index=[], columns=["time", "height", "velocity"])
