import { Button } from '@mui/material';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';

const WebcamStreamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

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
    </>
  );
};

export default WebcamStreamCapture;
