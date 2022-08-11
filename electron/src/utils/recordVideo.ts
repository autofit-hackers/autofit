import { SetStateAction } from 'react';
import { createWriteStream } from 'streamsaver';

export const startCapturingRepVideo = (
  canvas: HTMLCanvasElement,
  setVideoUrls: (update: SetStateAction<string[]>) => void,
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
    // 開始一分でレコーダーを自動停止
    setTimeout(() => {
      console.log('Finishing webcam recorder: 1 min passed since the recording started');
      recorder.stop();
    }, 60000);
  };
  recorder.onstop = () => {
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      setVideoUrls((prevUrls) => [...prevUrls, url]);
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
    // 開始一分でレコーダーを自動停止
    setTimeout(() => {
      console.log('time out');
      recorder.stop();
    }, 60000);
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

export const downloadVideo = async (url: string, fileName: string) => {
  await fetch(url).then(async (response) => {
    const blob = response.body;
    const fileSize = Number(response.headers.get('content-length'));
    const fileStream = createWriteStream(fileName, { size: fileSize }) as WritableStream<Uint8Array>;

    if (blob != null) {
      await blob.pipeTo(fileStream);
    }
  });
};
