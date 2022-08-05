import { SetStateAction } from 'react';

export const startCaptureWebcam = (
  canvas: HTMLCanvasElement,
  setRepVideoUrls: (update: SetStateAction<string[]>) => void,
): MediaRecorder => {
  const stream = canvas.captureStream();
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
  });
  const rec: { data: Array<Blob>; type: string } = { data: [], type: '' };
  recorder.ondataavailable = (e) => {
    rec.type = e.data.type;
    rec.data.push(e.data);
  };
  recorder.onstart = () => {
    setTimeout(() => {
      recorder.stop();
    });
  };
  recorder.onstop = () => {
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setRepVideoUrls((prevUrls) => [...prevUrls, url]);
    }
  };

  recorder.start();

  return recorder;
};

export const stopCaptureWebcam = (recorder: MediaRecorder) => {
  recorder.stop();
};
