import cv2
import time

# VideoCapture オブジェクトを取得します
capture = cv2.VideoCapture(2)
time.sleep(2)

while True:
    ret, frame = capture.read()
    cv2.imshow("frame", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

capture.release()
cv2.destroyAllWindows()
