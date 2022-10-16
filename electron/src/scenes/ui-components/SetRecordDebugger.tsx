import { Button } from '@mui/material';
import fs from 'fs';
import { useAtom } from 'jotai';
import { resetSet } from '../../training_data/set';
import { formDebugAtom, setRecordAtom } from '../atoms';

export default function DummySetRecordButton() {
  const [setRecord] = useAtom(setRecordAtom);
  const handleSave = () => {
    const data = setRecord;

    fs.writeFile('./resources/set/dummy.json', JSON.stringify(data), (err) => {
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
      set dummy record
    </Button>
  );
}

/**
 * デバッグモードかつ、setRecordがない場合にダミーを作成する
 * TODO: dummySetRecordファイルを作成する
 */
export const useDummySetRecordIfDebugMode = (): void => {
  const [setRecord, setSetRecord] = useAtom(setRecordAtom);
  const [isDebugMode] = useAtom(formDebugAtom);

  if (isDebugMode && setRecord.reps.length === 0) {
    setSetRecord(resetSet());
  }
};
