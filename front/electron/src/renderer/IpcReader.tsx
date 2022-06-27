import { Button } from '@mui/material';
import { useState } from 'react';

// document.querySelector('#open').addEventListener('click', async () => {
//   const { canceled, data } = await ipcRenderer.invoke('open');
//   if (canceled) return;
//   document.querySelector('#text').value = data[0] || '';
// });

const IpcReader = () => {
  const [text, dialoged] = useState('fight');
  return (
    <Button
      onClick={async () => {
        await window.myAPI.openDialog();
      }}
    >
      ファイルを選択
    </Button>
  );
};

export default IpcReader;
