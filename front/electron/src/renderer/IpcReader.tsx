import { Button } from '@mui/material';
import { useState } from 'react';

// document.querySelector('#open').addEventListener('click', async () => {
//   const { canceled, data } = await ipcRenderer.invoke('open');
//   if (canceled) return;
//   document.querySelector('#text').value = data[0] || '';
// });

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

// export default IpcReader;
