import { Button } from '@mui/material';
import { dummyComments } from '../utils/dummyData.ts/dummyComment';

export default function JsonExporter() {
  const exportJson = dummyComments;
  const onClickExport = () => {
    const fileName = 'finename.json';
    const data = new Blob([JSON.stringify(exportJson, null, 2)], { type: 'text/json' });
    const jsonURL = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = jsonURL;
    link.setAttribute('download', fileName);
    link.click();
    document.body.removeChild(link);
  };

  return <Button onClick={onClickExport}>Export</Button>;
}
