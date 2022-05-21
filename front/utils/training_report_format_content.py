from __future__ import annotations
from datetime import datetime
from typing import Any, Callable, Literal

ContentKey = Literal[
    "interpreter",
    "patient_id",
    "which",
    "scheie",
    "diagnoses",
    "created_at",
    "diagnosed_at",
]


def training_report_format_content(raw_content: dict[ContentKey, Any]):
    INPUT_FORMAT = r"%Y%m%d%H%M%S"
    OUTPUT_FORMAT = r"%Y-%m-%d %H:%M:%S"

    labels: dict[ContentKey, str] = {
        "interpreter": "読影医",
        "patient_id": "患者 ID",
        "which": "眼",
        "scheie": "Scheie 分類",
        "diagnoses": "所見",
        "created_at": "撮影日時",
        "diagnosed_at": "読影日時",
    }

    formatters: dict[ContentKey, Callable[[Any], str]] = {
        "which": lambda which: "左" if which == "L" else "右",
        "scheie": lambda scheie: f"H: {scheie['H']}&emsp; S: {scheie['S']}",
        "diagnoses": lambda diagnoses: "<br>".join(diagnoses),
        "created_at": lambda date_string: datetime.strptime(date_string, INPUT_FORMAT).strftime(OUTPUT_FORMAT),
        "diagnosed_at": lambda date_string: datetime.strptime(date_string, INPUT_FORMAT).strftime(OUTPUT_FORMAT),
    }

    content: dict[str, str] = {}

    for key, raw_value in raw_content.items():
        label = labels[key]
        formatter = formatters.get(key)
        value: str = raw_value if formatter is None else formatter(raw_value)
        content[label] = value

    return content
