import { Button } from '@mui/material';
import fs from 'fs';
import { useAtom } from 'jotai';
import { setRecordAtom, settingsAtom } from '../atoms';

export default function SaveSetRecordButton() {
  const [setRecord] = useAtom(setRecordAtom);
  const handleSave = () => {
    const data = setRecord;

    fs.writeFile('./resources/set/dummy2.json', JSON.stringify(data), (err) => {
      if (err) throw err;
      console.log('complete');
    });
  };

  return (
    <Button
      onClick={() => {
        handleSave();
      }}
      variant="outlined"
      sx={{ p: 1 }}
    >
      save set
    </Button>
  );
}

/**
 * デバッグモードかつ、setRecordがない場合にダミーを作成する
 */
export const useDummySetRecordIfDebugMode = (): void => {
  const [setRecord] = useAtom(setRecordAtom);
  const [settings] = useAtom(settingsAtom);

  if (settings.isDebugMode && setRecord.reps.length === 0) {
    // TODO: ダミーのsetRecordを作成する
    // setSetRecord({ ...dummySetRecord });
  }
};
