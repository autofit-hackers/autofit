import SaveAsIcon from '@mui/icons-material/SaveAs';
import { IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';
import { createWriteStream } from 'streamsaver';

export function SaveButtonWithDialog(props: { object: object; videoUrls: string[] }) {
  const { object, videoUrls } = props;

  const exportJson = (data: object, now: string) => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `setRecord_${now}.json`;

    link.click();
  };

  const downloadVideo = async (url: string, fileName: string) => {
    await fetch(url).then(async (response) => {
      const blob = response.body;
      const fileSize = Number(response.headers.get('content-length'));
      const fileStream = createWriteStream(fileName, { size: fileSize }) as WritableStream<Uint8Array>;

      if (blob != null) {
        await blob.pipeTo(fileStream);
      }
    });
  };

  const handleSave = () => {
    const now = `${dayjs().format('MM-DD-HH-mm-ss')}`;
    exportJson(object, now);
    for (let i = 0; i < videoUrls.length; i += 1) {
      void downloadVideo(videoUrls[i], `video-${now}_rep${i + 1}.mp4`);
    }
  };

  return (
    <IconButton onClick={handleSave}>
      <SaveAsIcon />
    </IconButton>
  );
}

export function AutoSaveButton(props: { object: object; videoBlobs: Blob[] }) {
  const { object, videoBlobs } = props;

  const writeJsonToFile = (data: object, dirPath: string, fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    writeFile(join(dirPath, fileName), jsonString, (err) => {
      if (err) throw err;
    });
  };

  const writeVideoToFile = async (blob: Blob, dirPath: string, fileName: string) => {
    const buffer = await blob.arrayBuffer();
    writeFile(join(dirPath, fileName), new DataView(buffer), (err) => {
      if (err) throw err;
    });
  };

  const handleSave = () => {
    const now = `${dayjs().format('MM-DD-HH-mm-ss')}`;
    const dirPath = join(process.cwd(), 'data', now);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    writeJsonToFile(object, dirPath, `training_data.json`);
    for (let i = 0; i < videoBlobs.length; i += 1) {
      void writeVideoToFile(videoBlobs[i], dirPath, `rep${i + 1}.mp4`);
    }
  };

  return (
    <IconButton onClick={handleSave}>
      <SaveAsIcon />
    </IconButton>
  );
}
