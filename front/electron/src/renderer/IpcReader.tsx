import { Button, Typography } from '@mui/material';
import { useState } from 'react';

export const IpcReader = () => {
  const [text, setText] = useState('Not set');
  return (
    <>
      <Button
        onClick={async () => {
          setText(await window.myAPI.openTxtFile());
        }}
      >
        ファイルを選択
      </Button>
      <Typography>{text}</Typography>
    </>
  );
};

interface Mes {
  message: string;
}

export const IpcSaver = (mes: Mes) => {
  const { message } = mes;
  const [text, dialoged] = useState('fight');
  return (
    <>
      <Button
        onClick={async () => {
          await window.myAPI.saveMessageFile(text);
        }}
      >
        保存だ！！
      </Button>
      <Button onClick={() => dialoged('great')}>ChangeTXT</Button>
    </>
  );
};
