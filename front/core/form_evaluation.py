from dataclasses import field
from pathlib import Path
from typing import Dict, Tuple

from lib.pose.training_set import RepObject
from PIL import Image


def squat_knees_in(rep_obj: RepObject) -> Tuple[bool, float]:
    """
    スクワット時に膝の開き具合が正しいかどうか判定

    Args:
        rep_obj (RepObject): 評価対象のRepデータ

    Returns:
        Tuple[bool, float]: (指導項目をクリアしているかどうか、評価スコア)
    """
    # TODO: 判定アルゴリズムは仮置しています
    bottom_pose = rep_obj.get_keyframe_pose(key="bottom")
    top_pose = rep_obj.get_keyframe_pose(key="top")
    bottom_knees_distance = bottom_pose.get_knees_distance()[1]
    top_pose_knee_y = top_pose.get_knee_position()[1]
    if bottom_knees_distance > top_pose_knee_y:
        return (False, 0.5)  # TODO: 未クリア時のスコアを0.5で仮置している。連続的にスコアを判定できる処理を実装すべき。
    return (True, 1)


def squat_depth(rep_obj: RepObject) -> Tuple[bool, float]:
    """
    スクワット時にしゃがみ込みの深さが適切かどうか判定

    Args:
        rep_obj (RepObject): 評価対象のRepデータ

    Returns:
        Tuple[bool, float]: (指導項目をクリアしているかどうか、評価スコア)
    """
    bottom_pose = rep_obj.get_keyframe_pose(key="bottom")
    top_pose = rep_obj.get_keyframe_pose(key="top")
    bottom_pose_hip_y = bottom_pose.get_hip_position()[1]
    top_pose_knee_y = top_pose.get_knee_position()[1]
    if bottom_pose_hip_y < top_pose_knee_y:
        return (False, 0.3)  # TODO: 未クリア時のスコアを0.5で仮置している。連続的にスコアを判定できる処理を実装すべき。
    return (True, 1)
