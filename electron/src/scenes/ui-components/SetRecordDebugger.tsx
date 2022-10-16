import { Button } from '@mui/material';
import { useAtom } from 'jotai';
import { resetSet } from '../../training_data/set';
import { formDebugAtom, setRecordAtom } from '../atoms';

export default function DummySetRecordButton() {
  const [, setSetRecord] = useAtom(setRecordAtom);

  return (
    <Button
      onClick={() => {
        setSetRecord(resetSet());
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
