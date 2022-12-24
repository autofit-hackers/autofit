import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

type Props = {
  selectedDeviceId: string | undefined;
  setSelectedDeviceId: Dispatch<SetStateAction<string | undefined>>;
};

function WebcamSelector(props: Props) {
  const { selectedDeviceId, setSelectedDeviceId } = props;
  const [webcams, setWebcams] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    // Get a list of available webcams
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      setWebcams(devices.filter((device) => device.kind === 'videoinput'));
    });
  }, []);

  const handleSwitchCamera = (event: SelectChangeEvent<string>) => {
    setSelectedDeviceId(event.target.value);
  };

  return (
    <FormControl>
      <Select value={selectedDeviceId} onChange={handleSwitchCamera}>
        {webcams.map((webcam) => (
          <MenuItem key={webcam.deviceId} value={webcam.deviceId}>
            {webcam.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default WebcamSelector;
