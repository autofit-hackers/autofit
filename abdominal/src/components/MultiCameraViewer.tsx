import { Button, CardMedia, Grid, Stack } from '@mui/material';
import dayjs from 'dayjs';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';
import { createRef, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

function MultiCameraViewer() {
  const numRows = 2;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const webcamRefs = useRef<RefObject<Webcam>[]>([]);
  const mediaRecorderRefs = useRef<RefObject<MediaRecorder>[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [replay, setReplay] = useState(false);
  const [blobURLs, setBlobURLs] = useState<string[]>([]);

  const writeVideoToFile = async (blob: Blob, dirPath: string, fileName: string) => {
    const buffer = await blob.arrayBuffer();
    writeFile(join(dirPath, fileName), new DataView(buffer), (err) => {
      if (err) throw err;
    });
  };

  const createWebcamStream = useCallback((webcam: Webcam, cameraId: number): MediaRecorder => {
    window.log.info(`Start capturing webcam ${cameraId}`);
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
      const timeOut = 600000; // 10 min
      setTimeout(() => {
        if (recorder.state === 'recording') {
          window.log.info('Finishing rep video recorder: 10 min passed since the recording started');
          recorder.stop();
        }
      }, timeOut);
    };
    recorder.start();
    recorder.onstop = () => {
      const blob = new Blob(rec.data, { type: rec.type });
      if (blob.size > 0) {
        window.log.info(`Write captured video to camera${cameraId}.mp4 in ${dirPath}`);
        void writeVideoToFile(blob, dirPath, `camera${cameraId}.mp4`);
        setBlobURLs((prev) => [...prev, URL.createObjectURL(blob)]);
      }
    };

    return recorder;
  }, []);

  const startCapturing = useCallback(() => {
    setCapturing(true);
    for (let i = 0; i < mediaRecorderRefs.current.length; i += 1) {
      if (webcamRefs.current[i].current != null) {
        mediaRecorderRefs.current[i].current = createWebcamStream(webcamRefs.current[i].current, i);
      }
    }
  }, [createWebcamStream]);

  const stopCapturing = useCallback(() => {
    mediaRecorderRefs.current.forEach((mediaRecorderRef) => {
      if (mediaRecorderRef.current != null) {
        mediaRecorderRef.current.stop();
      }
    });
    setCapturing(false);
    setReplay(true);
  }, []);

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
    for (let i = 0; i < devices.length; i += 1) {
      webcamRefs.current[i] = createRef<Webcam>();
      mediaRecorderRefs.current[i] = createRef<MediaRecorder | null>();
    }
  }, [devices.length, searchDevicesForWebcam]);

  return (
    <>
      {capturing ? (
        <Button onClick={stopCapturing} variant="contained">
          Stop Capture
        </Button>
      ) : (
        <Button onClick={startCapturing}>Start Capture</Button>
      )}
      {replay ? (
        <>
          <Button
            onClick={() => {
              blobURLs.forEach((blobURL) => URL.revokeObjectURL(blobURL));
              setBlobURLs([]);
              setReplay(false);
            }}
            variant="contained"
          >
            Stop Replay
          </Button>
          <Grid container spacing={1}>
            {devices.map((device, key) => (
              <Grid item xs={6}>
                <CardMedia component="video" src={blobURLs[key]} controls autoPlay loop />
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <Stack
          direction="column"
          sx={{ transform: 'rotate(90deg)', width: '50%' }}
          spacing={2}
          marginLeft="300px"
          justifyContent="center"
        >
          {devices.map((device, key) => (
            <Webcam
              audio={false}
              videoConstraints={{ deviceId: device.deviceId, width: 640 * numRows, height: 360 * numRows }}
              ref={webcamRefs.current[key]}
            />
          ))}
        </Stack>
      )}
    </>
  );
}

export default MultiCameraViewer;
