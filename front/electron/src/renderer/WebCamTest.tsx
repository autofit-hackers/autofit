import { Button, Card, CardMedia, Paper } from '@mui/material';

import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

const WebcamStreamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [replayUrl, setUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoBlob, setBlob] = useState<Blob>();

  const handleDataAvailable = useCallback(
    ({ data }: any) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );
  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    const options: MediaRecorderOptions = { mimeType: 'video/webm' };
    mediaRecorderRef.current = new MediaRecorder(
      webcamRef.current?.stream as MediaStream,
      options
    );
    mediaRecorderRef?.current?.addEventListener(
      'dataavailable',
      handleDataAvailable
    );
    mediaRecorderRef?.current?.start();
  }, [webcamRef, setCapturing, mediaRecorderRef, handleDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current!.stop();
    setCapturing(false);
  }, [mediaRecorderRef, setCapturing]);

  const handleDownload = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm',
      });
      const url = URL.createObjectURL(blob);
      setUrl(url);
      setBlob(blob);
      console.log(url);
      const a = document.createElement('a');
      document.body.appendChild(a);
      // a.style = 'display: none';
      a.href = url;
      a.download = 'react-webcam-stream-capture.webm';
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  useEffect(() => {
    videoRef.current?.play();
  }, []);

  return (
    <>
      <Webcam audio={false} ref={webcamRef} />
      {capturing ? (
        <Button onClick={handleStopCaptureClick}>Stop Capture</Button>
      ) : (
        <Button onClick={handleStartCaptureClick}>Start Capture</Button>
      )}
      {recordedChunks.length > 0 && (
        <Button onClick={handleDownload}>Download</Button>
      )}
      {videoBlob && (
        <>
          <Card sx={{ maxWidth: 600 }}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '40vh',
              }}
            >
              <CardMedia
                component="iframe"
                height="330"
                src={URL.createObjectURL(videoBlob)}
                allow="autoPlay"
              />
            </Paper>
          </Card>
        </>
      )}
    </>
  );
};

export default WebcamStreamCapture;
