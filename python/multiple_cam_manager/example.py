import logging
import threading

import cv2


class CamThread(threading.Thread):
    def __init__(self, cam_name, cam_id: int):
        threading.Thread.__init__(self)
        self.cam_name = cam_name
        self.cam_id = cam_id

    def run(self):
        logging.info(f"Starting {self.cam_name} thread")
        camPreview(self.cam_name, self.cam_id)


def camPreview(cam_name, cam_id):
    cv2.namedWindow(cam_name)
    cam = cv2.VideoCapture(cam_id)
    if cam.isOpened():  # try to get the first frame
        rval, frame = cam.read()
    else:
        rval = False

    while rval:
        cv2.imshow(cam_name, frame)
        rval, frame = cam.read()
        key = cv2.waitKey(20)
        if key == 27:  # exit on ESC
            break
    cv2.destroyWindow(cam_name)


def main():
    # Create two threads as follows
    thread1 = CamThread("Camera 1", 1)
    thread2 = CamThread("Camera 2", 2)
    thread1.start()
    thread2.start()


if __name__ == "__main__":
    main()
