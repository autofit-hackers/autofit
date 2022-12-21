/* eslint-disable */
import { Button } from '@mui/material';
import { useState } from 'react';
import WebcamSelectButton from '../../WebcamSelectButton';
import Webcam from '../utils/webCamWithId';

function WebcamOpenButton({ cameraRef, fps = 30 }: { cameraRef: React.RefObject<HTMLVideoElement>; fps?: number }) {
  const [streaming, setStreaming] = useState<null | string>(null); // streaming state
  const webcam = new Webcam(); // webcam handler
  const [webcamId, setWebcamId] = useState('');

  return (
    <>
      <Button
        onClick={() => {
          if (streaming === null && cameraRef.current !== null) {
            // if not streaming
            webcam.open(cameraRef.current, webcamId, fps); // open webcam
            cameraRef.current.style.display = 'block'; // show camera
            setStreaming('camera'); // set streaming to camera
          } else if (streaming === 'camera' && cameraRef.current !== null) {
            // closing video streaming
            webcam.close(cameraRef.current);
            cameraRef.current.style.display = 'none';
            setStreaming(null);
          } else throw new Error(`Can't handle more than 1 stream\nCurrently streaming`); // if streaming video
        }}
      >
        {streaming === 'camera' ? 'Close' : 'Open'} Webcam
      </Button>
      <WebcamSelectButton selectedDeviceId={webcamId} setSelectedDeviceId={setWebcamId} />
    </>
  );
}

export default WebcamOpenButton;
