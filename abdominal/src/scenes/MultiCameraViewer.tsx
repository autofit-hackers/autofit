import { Button, Grid } from '@mui/material';
import dayjs from 'dayjs';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';
import { createRef, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

function MultiCameraViewer() {
  const numRows = 2;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const webcamRefs = useRef<RefObject<Webcam>[]>([]);
  const mediaRecorderRefs = useRef<RefObject<MediaRecorder | null>[]>([]);
  const [capturing, setCapturing] = useState(false);

  const writeVideoToFile = async (blob: Blob, dirPath: string, fileName: string) => {
    const buffer = await blob.arrayBuffer();
    writeFile(join(dirPath, fileName), new DataView(buffer), (err) => {
      if (err) throw err;
    });
  };

  const startCapturingWebcam = useCallback((webcam: Webcam, cameraId: number): MediaRecorder => {
    const now = dayjs().format('YYYY-MM-DD-HH-mm-ss');
    const dirPath = `${process.cwd()}/log/${now}`;
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    if (!webcam.stream) {
      throw new Error('Webcam stream is not ready');
    }
    const recorder = new MediaRecorder(webcam.stream, {
      mimeType: 'video/webm',
    });
    const rec: { data: Array<Blob>; type: string } = { data: [], type: '' };
    recorder.ondataavailable = (e) => {
      rec.type = e.data.type;
      rec.data.push(e.data);
    };
    recorder.onstart = () => {
      // 開始10分でレコーダーを自動停止
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('Finishing rep video recorder: 10 min passed since the recording started');
          recorder.stop();
        }
      }, 600000);
    };
    recorder.start();
    recorder.onstop = () => {
      const blob = new Blob(rec.data, { type: rec.type });
      if (blob.size > 0) {
        void writeVideoToFile(blob, dirPath, `camera${cameraId}.mp4`);
      }
    };

    return recorder;
  }, []);

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    for (let i = 0; i < mediaRecorderRefs.current.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      mediaRecorderRefs.current[i].current = startCapturingWebcam(webcamRefs.current[i].current!, i);
    }
  }, [startCapturingWebcam]);

  const handleStopCaptureClick = useCallback(() => {
    for (let i = 0; i < mediaRecorderRefs.current.length; i += 1) {
      mediaRecorderRefs.current[i].current?.stop();
    }
    setCapturing(false);
  }, []);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(
        mediaDevices
          .filter(({ kind, label }) => kind === 'videoinput' && label !== 'FaceTime HD Camera')
          .sort((a, b) => Number(a.deviceId) + Number(b.deviceId)),
      ),

    [setDevices],
  );

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then(handleDevices);
    for (let i = 0; i < devices.length; i += 1) {
      webcamRefs.current[i] = createRef<Webcam>();
      mediaRecorderRefs.current[i] = createRef<MediaRecorder | null>();
    }
  }, [devices.length, handleDevices]);

  return (
    <>
      {capturing ? (
        <Button onClick={handleStopCaptureClick} variant="contained">
          Stop Capture
        </Button>
      ) : (
        <Button onClick={handleStartCaptureClick}>Start Capture</Button>
      )}
      <Grid container spacing={1}>
        {devices.map((device, key) => (
          <Grid item xs={6}>
            <Webcam
              audio={false}
              videoConstraints={{ deviceId: device.deviceId, width: 640 * numRows, height: 360 * numRows }}
              ref={webcamRefs.current[key]}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
}

export default MultiCameraViewer;
