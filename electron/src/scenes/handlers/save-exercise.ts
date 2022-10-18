import { existsSync, mkdirSync, writeFile } from 'fs';
import { join } from 'path';
import type { Set } from '@/training_data/set';

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

const saveExercise = (setObj: Set) => {
  const basePath = join(process.cwd(), 'log');
  const dirPath = join(basePath, setObj.setInfo.userName, setObj.setInfo.startTime);
  console.log('handle saving...', dirPath);
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  writeJsonToFile(setObj, dirPath, `training_data.json`);
  for (let i = 0; i < setObj.repVideoBlobs.length; i += 1) {
    void writeVideoToFile(setObj.repVideoBlobs[i], dirPath, `rep${i + 1}.mp4`);
  }
};

export default saveExercise;
