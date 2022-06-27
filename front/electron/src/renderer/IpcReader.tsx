import { Button } from '@mui/material';
import { useState } from 'react';

export const IpcReader = () => {
  const [text, dialoged] = useState('fight');
  return (
    <Button
      onClick={async () => {
        await window.myAPI.openFile();
      }}
    >
      ファイルを選択
    </Button>
  );
};

export const IpcSaver = () => {
  const [text, dialoged] = useState('fight');
  return (
    <Button
      onClick={async () => {
        await window.myAPI.saveFile();
      }}
    >
      保存だ！！
    </Button>
  );
};
