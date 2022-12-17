/* eslint-disable */
import { Button } from '@mui/material';
import { useState } from 'react';
import Webcam from '../utils/webCamWithId';

function WebcamOpenButton({
  cameraRef,
  deviceId,
}: {
  cameraRef: React.RefObject<HTMLVideoElement>;
  deviceId: string;
}) {
  const [streaming, setStreaming] = useState(null); // streaming state
  const webcam = new Webcam(); // webcam handler

  return (
    <>
      <Button
        onClick={() => {
          if (streaming === null) {
            // if not streaming
            webcam.open(cameraRef.current, deviceId); // open webcam
            cameraRef.current.style.display = 'block'; // show camera
            setStreaming('camera'); // set streaming to camera
            console.log(deviceId);
          } else if (streaming === 'camera') {
            // closing video streaming
            webcam.close(cameraRef.current);
            cameraRef.current.style.display = 'none';
            setStreaming(null);
          } else alert(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); // if streaming video
        }}
      >
        {streaming === 'camera' ? 'Close' : 'Open'} Webcam
      </Button>
    </>
  );
}

export default WebcamOpenButton;
