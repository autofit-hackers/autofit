import React from 'react';
import Webcam from 'react-webcam';
import { FormControl, Select, InputLabel, MenuItem } from '@mui/material';

function CamDeviceSelector() {
  const [deviceId, setDeviceId] = React.useState({});
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);

  // NOTE: iterate all camera devices
  const handleDevices = React.useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
    [setDevices]
  );

  React.useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(handleDevices)
      .catch((reason) => console.log(reason)); // FIXME: remove logging in production
  }, [handleDevices]);

  return (
    <>
      <Webcam
        audio={false}
        mirrored
        // NOTE: resize input video to full window size keeping the aspect ratio of the webcam
        style={{
          height: '99vh',
          width: '99%',
          objectFit: 'cover',
          position: 'absolute',
        }}
        videoConstraints={{ deviceId }}
      />

      {/* FIXME: initialize selector with default cam device */}
      <FormControl color="info" variant="filled">
        <InputLabel htmlFor="cam-device-select">Camera</InputLabel>
        <Select
          labelId="cam-device-select-label"
          id="webcam-device-select"
          value={{ deviceId }}
          label="Camera"
          onChange={(e) => setDeviceId(e.target.value as string)}
        >
          {devices.map((device) => (
            <MenuItem value={device.deviceId}>{device.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}

export default CamDeviceSelector;
