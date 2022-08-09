import { Rep } from '../training/rep';

export const startCaptureWebcam = (canvas: HTMLCanvasElement, rep: Rep): MediaRecorder => {
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
    // 開始一分でレコーダーを自動停止
    setTimeout(() => {
      console.log('recorder time out');
      recorder.stop();
    }, 60000);
  };
  recorder.onstop = () => {
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const videoUrl = URL.createObjectURL(blob);
      // eslint-disable-next-line no-param-reassign
      rep.videoUrl = videoUrl;
    }
  };

  recorder.start();

  return recorder;
};

export const stopCaptureWebcam = (recorder: MediaRecorder) => {
  recorder.stop();
};
