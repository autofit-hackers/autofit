import sys
import time

import cv2
import numpy as np

# put webcam id as command line arguements
if len(sys.argv) == 3:
    capture_1 = cv2.VideoCapture(int(sys.argv[1]))
    capture_2 = cv2.VideoCapture(int(sys.argv[2]))
else:
    print("Call program with input webcam!")
    quit()

print(f"camera1 is available:{capture_1.isOpened()}")
print(f"camera2 is available:{capture_2.isOpened()}")

# wait cameras to wake up
for i in range(5):
    print(f"start in {5-i} sec")
    t0 = time.time()
    time.sleep(1)
    t1 = time.time()

n = 0
print("press c to take photo or esc to exit")
while True:
    ret1, frame1 = capture_1.read()
    ret2, frame2 = capture_2.read()
    frame1 = cv2.rotate(frame1, cv2.ROTATE_90_COUNTERCLOCKWISE)
    frame2 = cv2.rotate(frame2, cv2.ROTATE_90_COUNTERCLOCKWISE)
    mergeImg = np.vstack((frame1, frame2))
    cv2.imshow("frame", mergeImg)
    key = cv2.waitKey(1) & 0xFF
    if key == ord("c"):
        cv2.imwrite(f"front_img/{n}.png", frame1)
        cv2.imwrite(f"side_img/{n}.png", frame2)
        n += 1
        print(f"image_{n} has been captured")
    elif key == 27:
        break

capture_1.release()
capture_2.release()
cv2.destroyAllWindows()
