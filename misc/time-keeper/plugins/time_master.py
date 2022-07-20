import argparse

import calendar
import datetime
import pickle
import re
from time import sleep
import csv

from slack_sdk import WebClient

_API_TOKEN = "xoxb-1751219287282-3623316152882-2JG2jmtLoYsu6bxBaBVkPBaT"  # 近藤に聞いてください
_CHANNEL_NAME = "1_0_timecard"
_START_COMMAND = "開始|再開"
_STOP_COMMAND = "終了|中断"


class User:
    def __init__(self, user_name, user_id):
        self.user_name = user_name
        self.user_id = user_id
        self.state = "stop"  # ['stop', 'working']
        self.last_command_time = None
        self.work_log = {}
        self.total = datetime.timedelta(0, 0, 0, -1.0)
        self.err = ""

    def update(self, ts, text):  # command ['開始'] とか
        date = datetime.datetime.strftime(ts, "%Y-%m-%d")

        if re.match(_START_COMMAND, text):

            if res := re.search("\d\d:\d\d", text):
                ts = datetime.datetime.strptime(
                    date + "-" + res.group(), "%Y-%m-%d-%H:%M"
                )

            self.last_command_time = ts
            if self.state == "stop":
                pass
            else:
                self.err += "START command in consecuitive! :{}\n".format(date)

            self.state = "working"
        elif re.match(_STOP_COMMAND, text):

            if res := re.search("\d\d:\d\d", text):
                ts = datetime.datetime.strptime(
                    date + "-" + res.group(), "%Y-%m-%d-%H:%M"
                )

            if self.last_command_time == None:
                self.err += "You may started this month with end command: {}\n".format(
                    date
                )
                return
            diff = ts - self.last_command_time

            if self.state == "working":
                if date in self.work_log:
                    self.work_log[date] += diff
                else:
                    self.work_log[date] = diff
            else:
                self.err += "STOP command in consecutive ! :{}\n".format(date)

            self.state = "stop"
        else:
            pass

    def compute_total(self):
        for ts in self.work_log.values():
            self.total += ts


def summarize_month(year: int, month: int, calc_salary: bool = False) -> str:
    token = _API_TOKEN
    client = WebClient(token=token)

    channel_ids = _get_channel_ids(client)
    user_ids = _get_user(client)

    start = datetime.datetime.strptime("{}-{}-01".format(year, month), "%Y-%m-%d")
    end = _get_last_date(start)
    start, end = start.timestamp(), end.timestamp()

    sorted_messages: list = []
    while True:
        histories = client.conversations_history(
            channel=channel_ids[_CHANNEL_NAME], oldest=start, latest=end, count=3000
        )
        sorted_messages: list = (
            sorted(histories["messages"], key=lambda x: x["ts"]) + sorted_messages
        )

        # 一度の API call で読み出せるメッセージは最大100件
        # これより少ない件数しか帰ってこないなら全部読み出し完了となる
        if len(histories["messages"]) < 100:
            break
        else:
            end: float = sorted_messages[0]["ts"]
            sleep(1.0)

    user_list = _count_work_logs(sorted_messages, user_ids)

    if calc_salary is True:
        summary_text = _calc_salary(user_list)
    else:
        summary_text = _summarize_to_text(user_list)
    return summary_text


def _get_last_date(dt: datetime.datetime) -> datetime.datetime:
    last_date = calendar.monthrange(dt.year, dt.month)[1]
    return dt.replace(day=last_date) + datetime.timedelta(days=1)


def _timedelta_to_str(timedelta: datetime.timedelta) -> str:
    days = timedelta.days
    minute = timedelta.seconds // 60
    hour = minute // 60 + 24 * days
    minute = minute % 60

    return "{:0>2}:{:0>2}".format(hour, minute)


def _timedelta_to_hours(timedelta: datetime.timedelta) -> float:
    days = timedelta.days
    minute = timedelta.seconds // 60
    hours = minute // 60 + 24 * days
    minute = minute % 60
    hours += (minute // 15) / 4  # 15分未満は切り捨て
    return hours


def _get_channel_ids(client) -> dict:
    channels = client.conversations_list(
        limit=1000,
    )["channels"]

    channel_ids = {}
    for channel in channels:
        channel_ids[channel["name"]] = channel["id"]

    return channel_ids


def _get_user(client) -> dict:
    user_ids = {}
    users = client.users_list(exclude_archived=1)
    for user in users["members"]:
        real_name = user["profile"]["real_name"]
        user_ids[real_name] = user["id"]
    return user_ids


def _from_datetime_to_float(ts: datetime.datetime) -> float:
    ts = float(ts)
    t = datetime.datetime.fromtimestamp(ts)
    return t


def _count_work_logs(sorted_messages: list, user_ids):
    user_list = {}
    for user_name, user_id in user_ids.items():
        user_list[user_id] = User(user_name, user_id)

    for message in sorted_messages:
        ts = _from_datetime_to_float(message["ts"])
        text = message["text"]
        user_id = message["user"]

        user_list[user_id].update(ts, text)

    for user in user_list:
        user_list[user].compute_total()

    return user_list


def _summarize_to_text(user_list):
    summary_text = ""
    for user in user_list.values():
        if user.total > datetime.timedelta(0, 0, 0, 0):
            summary_text += "\n ====== {} ======\n".format(user.user_name.center(22))
            if user.err != "":
                summary_text += "<@{}>, WARNING: \n{}".format(user.user_id, user.err)
            summary_text += "TOTAL               = {}\n".format(
                _timedelta_to_str(user.total)
            )
            for date, ts in user.work_log.items():
                summary_text += "{} =  {}\n\n".format(date, _timedelta_to_str(ts))

    return summary_text


def _calc_salary(user_list):
    summary_text = ""
    with open("./salary.csv") as f:
        reader = csv.reader(f)
        name2pay = {row[0]: row[1] for row in reader}

    salary_total: int = 0
    for user in user_list.values():
        if user.total > datetime.timedelta(0, 0, 0, 0):
            if user.err != "":
                summary_text += "<@{}>, WARNING: \n{}".format(user.user_id, user.err)
            pay_per_hour: int = int(name2pay[user.user_name])
            working_hours: float = _timedelta_to_hours(user.total)
            salary: int = int(pay_per_hour * working_hours)
            summary_text += "\n@{}\t{} * {} = {}".format(
                user.user_name, pay_per_hour, working_hours, salary
            )
            salary_total += salary
    print("TOTAL: {}".format(salary_total))

    return summary_text


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-y", type=int, required=True)
    parser.add_argument("-m", type=int, required=True)
    args = parser.parse_args()
    all_summary = summarize_month(year=args.y, month=args.m, calc_salary=False)
    print(all_summary)
