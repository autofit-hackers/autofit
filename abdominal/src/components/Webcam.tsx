import { Camera } from '@mediapipe/camera_utils';
import { RefObject, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';

type Props = {
  webcamRef: RefObject<Webcam>;
  deviceId: string | undefined;
  inputWidth: number;
  inputHeight: number;
  rotation: 'none' | 'left' | 'right' | 'flip';
  onFrame?: () => Promise<void>;
  style?: React.CSSProperties;
};

function WebcamAF(props: Props) {
  const { webcamRef, deviceId, inputWidth, inputHeight, rotation, onFrame, style } = props;
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

  const renderVideoOnCanvas = useCallback(() => {
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
  }, [rotationAngle, webcamRef]);

  const startCamera = useCallback(() => {
    if (webcamRef.current === null || webcamRef.current.video === null) {
      return;
    }
    const camera = new Camera(webcamRef.current.video, {
      onFrame: async () => {
        renderVideoOnCanvas();
        if (onFrame) {
          await onFrame();
        }
      },
    });
    void camera.start();
  }, [onFrame, renderVideoOnCanvas, webcamRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={rotation === 'none' || rotation === 'flip' ? inputWidth : inputHeight}
        height={rotation === 'none' || rotation === 'flip' ? inputHeight : inputWidth}
        style={style}
      />
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{ deviceId, width: inputWidth, height: inputHeight }}
        onUserMedia={startCamera}
        style={{ display: 'none' }}
      />
    </>
  );
}

WebcamAF.defaultProps = {
  onFrame: undefined,
  style: { backgroundColor: 'rgba(0,0,0, 0.5)' },
};

export default WebcamAF;
