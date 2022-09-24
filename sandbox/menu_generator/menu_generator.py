import argparse
from typing import List
from pprint import pprint
from functools import reduce

import numpy as np
import pandas as pd


MUSCLE_GROUPS = [
    "abdominal",
    "back",
    "biceps",
    "clave",
    "chest",
    "legs",
    "shoulder",
    "triceps",
]
ONE_REP_TIME = 5.0
INTERVAL_TIME = 90
MODALITY_TO_REPS = {"FW": 10, "C": 15, "M": 12}
SETS = [3, 5]

RANDOM_SEED = 0
np.random.seed(RANDOM_SEED)


def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--targets",
        choices=MUSCLE_GROUPS,
        nargs="+",
        help=f"Target muscle groups: choose from {', '.join(MUSCLE_GROUPS)}.",
        default=["chest", "triceps"],
    )
    parser.add_argument(
        "--time", type=int, default=90, help="Time for training in minutes."
    )
    return parser.parse_args()


# def pd_series_or(series1: pd.Series[bool], series2: pd.Series[bool]) -> pd.Series[bool]:
def pd_series_or(series1, series2):
    return series1 | series2


def column_have_any_of_targets(
    df: pd.DataFrame, column: str, targets: List[str]
):  # -> pd.Series[bool]
    column_have_target_gen = (
        df[column].str.contains(target, case=False) for target in targets
    )
    return reduce(pd_series_or, column_have_target_gen)


def generate_menu(targets: List[str], time_min: int):
    exercise_df = pd.read_csv("./exercise_list.tsv", sep="\t")

    # extract exercises for target muscle groups
    is_target = column_have_any_of_targets(exercise_df, "Muscle Group", targets)
    target_df = exercise_df[is_target]

    # calculate time (cost)
    target_df["Reps"] = target_df["Modality"].map(MODALITY_TO_REPS)
    target_df["Sets"] = np.random.choice(SETS, len(target_df))
    target_df["Time"] = (
        target_df["Reps"] * target_df["Sets"] * ONE_REP_TIME
        + target_df["Sets"] * INTERVAL_TIME
    )


if __name__ == "__main__":
    args_dict = vars(get_args())
    pprint(args_dict)

    generate_menu(**args_dict)
