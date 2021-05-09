import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import numpy as np
import pandas as pd
from tqdm import tqdm
from matplotlib.animation import FuncAnimation


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
        self.fig = plt.figure()
        self.ax = self.fig.add_subplot(projection="3d")

        df = pd.read_csv(csv_path)
        # create neck point
        df["Neck.x"] = (df["LeftShoulder.x"] + df["RightShoulder.x"]) / 2
        df["Neck.y"] = (df["LeftShoulder.y"] + df["RightShoulder.y"]) / 2
        df["Neck.z"] = (df["LeftShoulder.z"] + df["RightShoulder.z"]) / 2
        self.df_dict = df.to_dict(orient="records")

    def plot_single_frame(self, frame):
        # for row in self.df.to_dict(orient="records"):
        self.ax.clear()
        row = self.df_dict[frame]
        for start_joint, end_joint in self.pairs:
            x = [row[start_joint + ".x"], row[end_joint + ".x"]]
            y = [row[start_joint + ".y"], row[end_joint + ".y"]]
            z = [row[start_joint + ".z"], row[end_joint + ".z"]]
            self.ax.plot(x, y, z)
        return self.ax

    def render(self, frames):
        ani = FuncAnimation(self.fig, self.plot_single_frame, frames=frames)
        ani.save("output.gif", writer="imagemagick")


if __name__ == "__main__":
    csv_path = "./motion_data/sqwat-02.csv"
    frames = 10
    pose_plot_3d = PosePlot3D(csv_path)
    pose_plot_3d.render(frames)
