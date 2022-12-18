import FindReplaceIcon from '@mui/icons-material/FindReplace';
import { FormControl, IconButton, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

interface WebcamSelectButtonProps {
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
}

function WebcamSelectButton({ selectedDeviceId, setSelectedDeviceId }: WebcamSelectButtonProps) {
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);

  const searchDevicesForWebcam = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDeviceList(
        mediaDevices
          .filter(
            ({ kind, label }) => kind === 'videoinput' && label !== 'FaceTime HD Camera' && !/iPhone/.test(label),
          )
          .sort((a, b) => Number(a.deviceId) + Number(b.deviceId)),
      ),

    [setDeviceList],
  );

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then(searchDevicesForWebcam);
  }, [searchDevicesForWebcam]);

  return (
    <Stack direction="row" alignItems="center">
      <FormControl size="medium" sx={{ minWidth: 300 }}>
        <InputLabel>Webcam</InputLabel>
        <Select
          label="webcam"
          value={selectedDeviceId}
          onChange={(event) => {
            setSelectedDeviceId(event.target.value);
          }}
        >
          {deviceList.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <IconButton
        onClick={() => {
          void navigator.mediaDevices.enumerateDevices().then(searchDevicesForWebcam);
        }}
      >
        <FindReplaceIcon />
      </IconButton>
    </Stack>
  );
}

export default WebcamSelectButton;
