import glob
import os
from datetime import datetime
from time import sleep

import cv2
import numpy as np

IMG_PATH = "test"
TMP_FOLDER_PATH = "./tmp/"
MTX_PATH = TMP_FOLDER_PATH + "mtx.csv"
DIST_PATH = TMP_FOLDER_PATH + "dist.csv"
SAVE_FOLDER_PATH = "./test/"

# メイン関数
def main():
    calibrateImage()  # 画像の歪みを補正


# カメラの歪みをCSVファイルを元に補正する関数
def calibrateImage():
    mtx, dist = loadCalibrationFile(MTX_PATH, DIST_PATH)

    for fn in glob.glob(f"{IMG_PATH}/*"):
        img = cv2.imread(fn)
        resultImg = cv2.undistort(img, mtx, dist, None)  # 内部パラメータを元に画像補正
        img_name = os.path.basename(fn)
        saveImgByTime(SAVE_FOLDER_PATH, resultImg, img_name)


# キャリブレーションCSVファイルを読み込む関数
def loadCalibrationFile(mtx_path, dist_path):
    try:
        mtx = np.loadtxt(mtx_path, delimiter=",")
        dist = np.loadtxt(dist_path, delimiter=",")
    except Exception as e:
        raise e
    return mtx, dist


# 画像を時刻で保存する関数
def saveImgByTime(dirPath, img, img_name):
    # 時刻を取得
    path = dirPath + "result_" + img_name
    cv2.imwrite(path, img)  # ファイル保存
    print("saved: ", path)


if __name__ == "__main__":
    main()
