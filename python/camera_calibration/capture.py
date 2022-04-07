import sys
import time

import cv2
import numpy as np

# put webcam id as command line arguements
captures = []
if len(sys.argv) >= 2:
    for idx, arg in enumerate(sys.argv[1:]):
        captures.append(cv2.VideoCapture(int(arg)))
        print(f"camera_{idx} is available")
else:
    print("Call program with input webcam!")
    quit()

# wait cameras to wake up
for i in range(3):
    print(f"start in {3-i} sec")
    t0 = time.time()
    time.sleep(1)
    t1 = time.time()

n = 0
print("press c to take photo or esc to exit")
while True:
    frames = []
    for capture in captures:
        ret, frame = capture.read()
        frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
        frames.append(frame)
    mergeImg = np.vstack(frames)
    cv2.imshow("webcam inputs", mergeImg)
    key = cv2.waitKey(1) & 0xFF
    if key == ord("c"):
        for idx, frame in enumerate(frames):
            cv2.imwrite(f"camera{idx}_img{n}.png", frame)
        n += 1
        print(f"images_{n} has been captured")
    elif key == 27:
        break

for capture in captures:
    capture.release()
cv2.destroyAllWindows()
