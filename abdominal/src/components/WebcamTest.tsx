import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import ReactWebcam from 'react-webcam';
import Webcam from './Webcam';

function WebcamSelector() {
  // Set the selected webcam as the source for the Webcam component
  const webcamRef = useRef<ReactWebcam>(null);
  const [selectedWebcam, setSelectedWebcam] = useState<string>();
  const [webcams, setWebcams] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    // Get a list of available webcams
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      setWebcams(devices.filter((device) => device.kind === 'videoinput'));
    });
  }, []);

  const handleSwitchCamera = (event: SelectChangeEvent<string>) => {
    setSelectedWebcam(event.target.value);
  };

  return (
    <>
      <FormControl>
        <Select value={selectedWebcam} onChange={handleSwitchCamera}>
          {webcams.map((webcam) => (
            <MenuItem key={webcam.deviceId} value={webcam.deviceId}>
              {webcam.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Webcam webcamRef={webcamRef} deviceId={selectedWebcam} inputWidth={720} inputHeight={480} rotation="left" />
    </>
  );
}

export default WebcamSelector;
