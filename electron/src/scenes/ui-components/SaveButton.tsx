import SaveAsIcon from '@mui/icons-material/SaveAs';
import { IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';

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

export const handleSave = (object: object, videoBlobs: Blob[]) => {
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

export function AutoSaveButton(props: { object: object; videoBlobs: Blob[] }) {
  const { object, videoBlobs } = props;

  return (
    <IconButton onClick={() => handleSave(object, videoBlobs)}>
      <SaveAsIcon />
    </IconButton>
  );
}
