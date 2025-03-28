import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

type Props = {
  webcamRef: RefObject<Webcam>;
  inputWidth: number;
  inputHeight: number;
  rotation: 'none' | 'left' | 'right' | 'flip';
  onFrame?: (frame: HTMLCanvasElement) => Promise<void> | void;
  style?: React.CSSProperties;
};

function WebcamAF(props: Props) {
  const { webcamRef, inputWidth, inputHeight, rotation, onFrame, style } = props;
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [webcamList, setWebcamList] = useState<MediaDeviceInfo[]>([]);
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

  const processFrame = useCallback(async () => {
    if (canvasRef.current === null) return;
    renderVideoOnCanvas();
    if (onFrame) {
      await onFrame(canvasRef.current);
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(processFrame);
  }, [onFrame, renderVideoOnCanvas]);

  const startCamera = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(processFrame);
  }, [processFrame]);

  useEffect(() => {
    // Get a list of available webcams
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      setWebcamList(devices.filter((device) => device.kind === 'videoinput'));
      setSelectedDeviceId(devices[0]?.deviceId);
    });
  }, []);

  const handleSwitchCamera = (event: SelectChangeEvent<string>) => {
    setSelectedDeviceId(event.target.value);
  };

  return (
    <div style={style}>
      {selectedDeviceId && (
        <>
          <canvas
            ref={canvasRef}
            width={rotation === 'none' || rotation === 'flip' ? inputWidth : inputHeight}
            height={rotation === 'none' || rotation === 'flip' ? inputHeight : inputWidth}
          />
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={{ deviceId: selectedDeviceId, width: inputWidth, height: inputHeight }}
            onUserMedia={startCamera}
            style={{ display: 'none' }}
          />
          <FormControl>
            <Select value={selectedDeviceId} onChange={handleSwitchCamera}>
              {webcamList.map((webcam) => (
                <MenuItem key={webcam.deviceId} value={webcam.deviceId}>
                  {webcam.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
    </div>
  );
}

WebcamAF.defaultProps = {
  onFrame: undefined,
  style: {},
};

export default WebcamAF;
