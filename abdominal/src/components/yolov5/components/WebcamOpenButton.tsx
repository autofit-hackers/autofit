/* eslint-disable */
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import Webcam from '../utils/webCamWithId';

function WebcamOpenButton({ cameraRef, fps = 1 }: { cameraRef: React.RefObject<HTMLVideoElement>; fps?: number }) {
  const [streaming, setStreaming] = useState<null | string>(null); // streaming state
  const webcam = new Webcam(); // webcam handler

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [webcamId, setWebcamId] = useState('');

  const searchDevicesForWebcam = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(
        mediaDevices
          .filter(
            ({ kind, label }) => kind === 'videoinput' && label !== 'FaceTime HD Camera' && !/iPhone/.test(label),
          )
          .sort((a, b) => Number(a.deviceId) + Number(b.deviceId)),
      ),

    [setDevices],
  );

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then(searchDevicesForWebcam);
  }, [searchDevicesForWebcam]);

  return (
    <>
      <FormControl size="medium">
        <InputLabel id="demo-simple-select-label">Age</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          label="Age"
          value={webcamId}
          onChange={(event) => {
            setWebcamId(event.target.value);
          }}
        >
          {devices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
          } else alert(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); // if streaming video
        }}
      >
        {streaming === 'camera' ? 'Close' : 'Open'} Webcam
      </Button>
      <Button
        onClick={() => {
          void navigator.mediaDevices.enumerateDevices().then(searchDevicesForWebcam);
        }}
      >
        get webcam
      </Button>
    </>
  );
}

export default WebcamOpenButton;
