import dayjs from 'dayjs';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';

const writeVideoToFile = async (blob: Blob, dirPath: string, fileName: string) => {
  const buffer = await blob.arrayBuffer();
  writeFile(join(dirPath, fileName), new DataView(buffer), (err) => {
    if (err) throw err;
  });
};

const mediaRecorder = (media: HTMLCanvasElement | HTMLVideoElement, cameraName: string): MediaRecorder => {
  let stream: MediaStream;
  if (media instanceof HTMLCanvasElement) {
    stream = media.captureStream();
  } else if (media instanceof HTMLVideoElement) {
    stream = media.srcObject as MediaStream;
  } else {
    throw new Error('media is not HTMLCanvasElement or HTMLVideoElement');
  }
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm',
  });
  const rec: { data: Array<Blob>; type: string } = { data: [], type: '' };
  recorder.ondataavailable = (e) => {
    rec.type = e.data.type;
    rec.data.push(e.data);
  };

  const now = dayjs().format('YYYY-MM-DD-HH-mm-ss');
  const dirPath = `${process.cwd()}/log/${now}`;
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  recorder.onstart = () => {
    console.log('recorder start');
    // 開始10分でレコーダーを自動停止
    setTimeout(() => {
      if (recorder.state === 'recording') {
        console.warn('Finishing rep video recorder: 10 min passed since the recording started');
        recorder.stop();
      }
    }, 60000);
  };

  recorder.onstop = () => {
    console.log('recorder stop');
    const blob = new Blob(rec.data, { type: rec.type });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      void writeVideoToFile(blob, dirPath, `camera${cameraName}.mp4`);

      return { blob, url };
    }

    return null;
  };

  return recorder;
};

export default mediaRecorder;
