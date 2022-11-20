import { useCallback, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

function MultiCameraViewer() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
    [setDevices],
  );

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  return (
    <>
      {devices.map((device, key) => (
        <div>
          <Webcam audio={false} videoConstraints={{ deviceId: device.deviceId }} />
          {device.label || `Device ${key + 1}`}
        </div>
      ))}
    </>
  );
}

export default MultiCameraViewer;
