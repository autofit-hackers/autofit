import { Button } from '@mui/material';
import { useState } from 'react';

export const IpcReader = () => {
  const [text, dialoged] = useState('ファイルを選択');
  return (
    <>
      <Button
        onClick={async () => {
          dialoged(await window.myAPI.openTxtFile());
        }}
      >
        {text}
      </Button>
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
