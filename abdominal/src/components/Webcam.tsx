import { RefObject, useRef } from 'react';
import ReactWebcam from 'react-webcam';

type Props = {
  webcamRef: RefObject<ReactWebcam>;
  deviceId: string | undefined;
  inputWidth: number;
  inputHeight: number;
  rotation: 'none' | 'left' | 'right' | 'flip';
};

function Webcam(props: Props) {
  const { webcamRef, deviceId, inputWidth, inputHeight, rotation } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let rotationAngle: number;
  switch (rotation) {
    case 'left':
      rotationAngle = 90;
      break;
    case 'right':
      rotationAngle = -90;
      break;
    case 'flip':
      rotationAngle = 180;
      break;
    default:
      rotationAngle = 0;
      break;
  }

  const rotateVideo = () => {
    if (webcamRef.current && webcamRef.current.video && canvasRef.current) {
      const canvas = canvasRef.current;
      const { video } = webcamRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (canvasCtx == null) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.translate(canvas.width / 2, canvas.height / 2);
      canvasCtx.rotate((rotationAngle * Math.PI) / 180);
      canvasCtx.drawImage(webcamRef.current.video, -video.videoWidth / 2, -video.videoHeight / 2);
      canvasCtx.restore();
    }

    requestAnimationFrame(rotateVideo);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={rotation === 'none' || rotation === 'flip' ? inputWidth : inputHeight}
        height={rotation === 'none' || rotation === 'flip' ? inputHeight : inputWidth}
        style={{ backgroundColor: 'rgba(0,0,0, 0.5)' }}
      />
      <ReactWebcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{ deviceId, width: inputWidth, height: inputHeight }}
        onUserMedia={rotateVideo}
        style={{ display: 'none' }}
      />
    </>
  );
}

export default Webcam;
