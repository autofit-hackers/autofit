import { Set } from '../training_data/set';

export const startCapturingRepVideo = (canvas: HTMLCanvasElement, set: Set): MediaRecorder => {
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
    // 開始1分でレコーダーを自動停止
    setTimeout(() => {
      if (recorder.state === 'recording') {
        console.log('Finishing rep video recorder: 1 min passed since the recording started');
        recorder.stop();
      }
    }, 60000);
  };
  recorder.onstop = () => {
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      set.repVideoBlobs.push(blob);
      set.repVideoUrls.push(url);
    }
  };

  recorder.start();

  return recorder;
};

// TODO: 上の関数とまとめたい
export const startCapturingSetVideo = (
  canvas: HTMLCanvasElement,
  setVideoUrl: React.MutableRefObject<string>,
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
    // 開始3分でレコーダーを自動停止
    setTimeout(() => {
      if (recorder.state === 'recording') {
        console.log('Finishing set video recorder: 3 min passed since the recording started');
        recorder.stop();
      }
    }, 180000);
  };
  recorder.onstop = () => {
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      // eslint-disable-next-line no-param-reassign
      setVideoUrl.current = url;
    }
  };

  recorder.start();

  return recorder;
};
