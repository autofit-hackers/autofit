import time

import cv2
import numpy as np

# VideoCapture オブジェクトを取得します

capture_1 = cv2.VideoCapture(0)
capture_2 = cv2.VideoCapture(1)

print(capture_1.isOpened())
print(capture_2.isOpened())

# wait camera to wake up
time.sleep(5)

n = 0
while True:
    ret1, frame1 = capture_1.read()
    ret2, frame2 = capture_2.read()
    frame2_vis = cv2.resize(frame2, dsize=(1280, 720))
    mergeImg = np.vstack((frame1, frame2_vis))
    cv2.imshow("frame", mergeImg)
    key = cv2.waitKey(1) & 0xFF
    if key == ord("c"):
        cv2.imwrite(f"front_img/{n}.jpg", frame1)
        cv2.imwrite(f"side_img/{n}.jpg", frame2)
        n += 1
        print(f"image_{n} has been captured")
    elif key == ord("q"):
        break

capture_2.release()
cv2.destroyAllWindows()
