from matplotlib.pyplot import plot
from pandas.core.base import DataError
from pandas.core.frame import DataFrame
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd


class PosePlot3D(object):
    def __init__(self, csv_path):
        self.pairs = [
            ["LeftShoulder", "LeftHand"],
            ["RightShoulder", "RightHand"],
            ["Neck", "LeftShoulder"],
            ["Neck", "RightShoulder"],
            ["Neck", "Waist"],
            ["Waist", "LeftKnee"],
            ["Waist", "RightKnee"],
            ["LeftKnee", "LeftFoot"],
            ["RightKnee", "RightFoot"],
        ]
        df = pd.read_csv(csv_path)
        # down sampling
        df = df[::10]
        # create neck point
        df["Neck.x"] = (df["LeftShoulder.x"] + df["RightShoulder.x"]) / 2
        df["Neck.y"] = (df["LeftShoulder.y"] + df["RightShoulder.y"]) / 2
        df["Neck.z"] = (df["LeftShoulder.z"] + df["RightShoulder.z"]) / 2
        # create t
        df["t"] = df["dt"].cumsum()

        # visualize with plotly
        # fig = px.scatter(df)
        # fig.show()
        joints = [
            "LeftShoulder",
            "LeftHand",
            "RightShoulder",
            "RightHand",
            "Neck",
            "Waist",
            "LeftKnee",
            "LeftFoot",
            "RightKnee",
            "RightFoot",
        ]
        plotly_df = DataFrame()
        for joint in joints:
            x = df[joint + ".x"]
            y = df[joint + ".y"]
            z = df[joint + ".z"]
            t = df["t"]
            # tmp_df = pd.concat([t, x, y, z], axis=1)
            tmp_df = pd.concat(
                {
                    "t": t,
                    "x": x,
                    "y": y,
                    "z": z,
                },
                axis=1,
            )
            tmp_df["joint"] = joint
            plotly_df = pd.concat([plotly_df, tmp_df])

        print(plotly_df.describe())
        fig = px.scatter_3d(
            plotly_df,
            x="x",
            y="y",
            z="z",
            color="joint",
            labels="joint",
            animation_frame="t",
            animation_group="joint",
            range_x=(-2, 2),
            range_y=(-2, 2),
            range_z=(-2, 2),
        )
        fig.update_layout(scene_aspectmode="cube")
        fig.show()
        exit()
        df = px.data.gapminder().query("continent=='Europe'")
        fig = px.line_3d(df, x="gdpPercap", y="pop", z="year", color="country")
        fig.show()

        print(df.head())
        self.fig = go.Figure()

    def plot_single_frame(self, frame):
        # for row in self.df.to_dict(orient="records"):
        self.ax.clear()
        row = self.df_dict[frame]
        for start_joint, end_joint in self.pairs:
            x = [row[start_joint + ".x"], row[end_joint + ".x"]]
            y = [row[start_joint + ".y"], row[end_joint + ".y"]]
            z = [row[start_joint + ".z"], row[end_joint + ".z"]]
            label = start_joint + "_" + end_joint
            self.ax.plot(x, y, z, label=label)
        return xs, ys, zs


if __name__ == "__main__":
    csv_path = "./motion_data/sqwat-04.csv"
    hoge = PosePlot3D(csv_path)
