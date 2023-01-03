import cv from 'opencv-ts';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import Camera from './Camera';

function FisheyeCorrection() {
  // const map1: Mat = new cv.Mat(1, 1, cv.CV_8UC4);
  // const map2: Mat = new cv.Mat(1, 1, cv.CV_8UC4);

  const webcamRef = useRef<Webcam>(null);
  const dstCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isCvLoaded, setIsCvLoaded] = useState(false);

  cv.onRuntimeInitialized = () => {
    setIsCvLoaded(true);
  };

  const processCV = useCallback((frame: HTMLCanvasElement) => {
    if (dstCanvasRef.current === null) return;
    dstCanvasRef.current.width = frame.width;
    dstCanvasRef.current.height = frame.height;
    const src = cv.imread(frame);
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.imshow(dstCanvasRef.current, dst);
    src.delete();
    dst.delete();
  }, []);

  return (
    <div>
      {isCvLoaded && (
        <>
          <Camera webcamRef={webcamRef} onFrame={processCV} inputWidth={720} inputHeight={480} rotation="left" />
          <canvas ref={dstCanvasRef} />
        </>
      )}
    </div>
  );
}

export default FisheyeCorrection;
