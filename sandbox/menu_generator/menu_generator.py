import argparse
from typing import List
from pprint import pprint
from functools import reduce

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


def generate_menu(targets: List[str], time: int):
    exercise_df = pd.read_csv("./exercise_list.tsv", sep="\t")

    is_target = column_have_any_of_targets(exercise_df, "Muscle Group", targets)
    target_df = exercise_df[is_target]
    print(target_df)


if __name__ == "__main__":
    args_dict = vars(get_args())
    pprint(args_dict)

    generate_menu(**args_dict)
