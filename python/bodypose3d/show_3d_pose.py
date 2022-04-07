import sys

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from mpl_toolkits.mplot3d import Axes3D

from utils import DLT

plt.style.use("seaborn")

pose_record_dir = "./pose_record"
include_head = False

"""keypoint setting"""
pose_keypoints = [16, 14, 12, 11, 13, 15, 24, 23, 25, 26, 27, 28]
if include_head:
    pose_keypoints.append(0)


"""3D vizualization setting"""
torso = [[0, 1], [1, 7], [7, 6], [6, 0]]
armr = [[1, 3], [3, 5]]
arml = [[0, 2], [2, 4]]
legr = [[6, 8], [8, 10]]
legl = [[7, 9], [9, 11]]
body = [torso, arml, armr, legr, legl]
colors = ["red", "blue", "green", "black", "orange"]


def read_keypoints(filename):

    fin = open(filename, "r")
    kpts = []
    while True:
        line = fin.readline()
        if line == "":
            break

        line = line.split()
        line = [float(s) for s in line]

        line = np.reshape(line, (len(pose_keypoints), -1))
        kpts.append(line)

    kpts = np.array(kpts)
    return kpts


def standardize_keypoints(kpts):

    """set the center of feet to [0,0,0]"""
    kpts = kpts - (kpts[0, 10, :] + kpts[0, 11, :]) / 2 + [0, 0, 50]

    return kpts


def exclude_outliers(kpts, alpha=0.2, threshold=1.5):

    for keypoint in range(kpts.shape[1]):
        """set DataFrame to use exponential moving average"""
        df = pd.DataFrame(kpts[:, keypoint, :])
        ewm_mean = df.ewm(alpha=alpha).mean()  # 指数加重移動平均
        ewm_std = df.ewm(alpha=alpha).std()  # 指数加重移動標準偏差
        outlier = df[(df - ewm_mean).abs() > ewm_std * threshold]

        """if outlier's index: use ewm_mead, else: use original value"""
        print(f"number of outlier in keypoint{keypoint}:{outlier.notnull().values.sum()}")
        kpts[:, keypoint, :] = np.where(~np.isnan(outlier), ewm_mean.values, kpts[:, keypoint, :])

    return kpts


def visualize_3d(p3ds):

    fig = plt.figure()
    ax = fig.add_subplot(111, projection="3d")

    while True:
        for framenum, kpts3d in enumerate(p3ds):
            for bodypart, part_color in zip(body, colors):
                for _c in bodypart:
                    ax.plot(
                        xs=[kpts3d[_c[0], 0], kpts3d[_c[1], 0]],
                        ys=[kpts3d[_c[0], 1], kpts3d[_c[1], 1]],
                        zs=[kpts3d[_c[0], 2], kpts3d[_c[1], 2]],
                        linewidth=4,
                        c=part_color,
                    )
            # uncomment these if you want scatter plot of keypoints and their indices.
            # for i in range(12):
            #     #ax.text(kpts3d[i,0], kpts3d[i,1], kpts3d[i,2], str(i))
            #     #ax.scatter(xs = kpts3d[i:i+1,0], ys = kpts3d[i:i+1,1], zs = kpts3d[i:i+1,2])

            # ax.set_axis_off()
            ax.set_xticks([])
            ax.set_yticks([])
            ax.set_zticks([])

            ax.set_xlim3d(-50, 50)
            ax.set_xlabel("x")
            ax.set_ylim3d(-50, 50)
            ax.set_ylabel("y")
            ax.set_zlim3d(50, 100)
            ax.set_zlabel("z")
            plt.pause(0.1)
            ax.cla()


def main():

    # put keypoints file as command line argument
    if len(sys.argv) == 2:
        keypoints_file = f"{pose_record_dir}/{sys.argv[1]}.dat"
    else:
        keypoints_file = f"{pose_record_dir}/kpts_3d.dat"

    # process keypoint coordinates
    p3ds = read_keypoints(keypoints_file)
    p3ds = exclude_outliers(p3ds)
    p3ds = standardize_keypoints(p3ds)

    visualize_3d(p3ds)


if __name__ == "__main__":

    main()
