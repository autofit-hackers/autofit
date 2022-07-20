import time

import cv2
import mediapipe as mp

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands


cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FPS, 60)

# wait cameras to wake up
for i in range(5):
    print(f"start in {5-i} sec")
    t0 = time.time()
    time.sleep(1)
    t1 = time.time()

with mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5, model_complexity=0) as hands:

    while cap.isOpened():
        start_read = time.time()
        success, image = cap.read()
        start = time.time()

        # Flip the image horizontally for a later selfie-view display
        # Convert the BGR image to RGB.
        image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)

        # To improve performance, optionally mark the image as not writeable to
        # pass by reference.
        image.flags.writeable = False

        # Process the image and find hands
        results = hands.process(image)

        image.flags.writeable = True

        # Draw the hand annotations on the image.
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:

                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

        end = time.time()

        cv2.putText(
            image,
            f"FPS without read: {int(1/(end - start))}",
            (50, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.5,
            (0, 255, 0),
            2,
        )
        cv2.putText(
            image,
            f"FPS with read: {int(1/(end - start_read))}",
            (50, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.5,
            (255, 0, 0),
            2,
        )

        cv2.imshow("MediaPipe Hands", image)

        if cv2.waitKey(5) & 0xFF == 27:
            break

cap.release()
