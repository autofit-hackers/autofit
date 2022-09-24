import argparse
from typing import List
from pprint import pprint
from functools import reduce
import bisect

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
MODALITY_TO_REPS = {"FW": 10, "C": 15, "M": 12}
JOINT_TO_INTERVAL_TIME = {"M": 90, "S": 60}
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


def column_have_any_of_targets(
    df: pd.DataFrame, column: str, targets: List[str]
):  # -> pd.Series[bool]
    column_have_target_gen = (
        df[column].str.contains(target, case=False) for target in targets
    )
    return reduce(lambda series1, series2: series1 | series2, column_have_target_gen)


def solve_knapsack_problem(df: pd.DataFrame, weight_col: str, value_col: str, time: int):
    n = len(df)

    # initialize dynamic programming table
    dp = [[0] * ]
    v_inf: int = df[value_col].sum()



def generate_menu(targets: List[str], time: int):
    exercise_df = pd.read_csv("./exercise_list.tsv", sep="\t")

    # extract exercises for target muscle groups
    is_target = column_have_any_of_targets(exercise_df, "Muscle Group", targets)
    target_df = exercise_df[is_target]

    # calculate time (cost) for each exercise
    target_df["Reps"] = target_df["Modality"].map(MODALITY_TO_REPS)
    target_df["Sets"] = np.random.choice(SETS, len(target_df))
    target_df["IntervalTime"] = target_df["Modality"].map(JOINT_TO_INTERVAL_TIME)
    target_df["Time"] = (
        target_df["Reps"] * target_df["Sets"] * ONE_REP_TIME
        + target_df["Sets"] * target_df["IntervalTime"]
    )




if __name__ == "__main__":
    args_dict = vars(get_args())
    pprint(args_dict)

    generate_menu(**args_dict)
