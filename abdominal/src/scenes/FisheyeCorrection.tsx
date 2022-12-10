import cv, { Mat } from 'opencv-ts';
import { useEffect, useRef } from 'react';

function FisheyeCorrection() {
  // const map1: Mat = new cv.Mat(1, 1, cv.CV_8UC4);
  // const map2: Mat = new cv.Mat(1, 1, cv.CV_8UC4);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const FPS = 30;

  useEffect(() => {
    cv.onRuntimeInitialized = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current == null) return;
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        })
        .catch((err) => {
          console.log(err);
        });
      if (videoRef.current == null) return;
      const src = new cv.Mat(videoRef.current.height, videoRef.current.width, cv.CV_8UC4);
      const dst: Mat = new cv.Mat(videoRef.current.height, videoRef.current.width, cv.CV_8UC1);
      const cap = new cv.VideoCapture(videoRef.current);

      const processVideo = () => {
        try {
          const begin = Date.now();
          cap.read(src);
          cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
          // cv.remap(dst, dst, map1, map2, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
          cv.imshow('canvasOutput', dst);
          // schedule next one.
          const delay = 1000 / FPS - (Date.now() - begin);
          setTimeout(processVideo, delay);
        } catch (err) {
          console.log(err);
        }
      };

      // schedule the first one.
      setTimeout(() => processVideo(), 0);
    };
  });

  return (
    <>
      <video ref={videoRef} id="videoInput" autoPlay>
        <track kind="captions" />
      </video>
      <canvas ref={canvasRef} id="canvasOutput" />
    </>
  );
}

export default FisheyeCorrection;
