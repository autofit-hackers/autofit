import { useAtom } from 'jotai';
import { useEffect } from 'react';
import ResultForTrainer from '../stories/ResultPageForTrainer';
import { resetSet, revokeVideoUrls } from '../training_data/set';
import { stopKinect } from '../utils/kinect';
import { kinectAtom, phaseAtom, setRecordAtom, settingsAtom } from './atoms';
import saveExercise from './handlers/save-exercise';

export default function Result() {
  const [, setPhase] = useAtom(phaseAtom);
  const [setRecord, setSetRecord] = useAtom(setRecordAtom);
  const [settings] = useAtom(settingsAtom);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // Kinectを停止する
  useEffect(() => {
    stopKinect(kinect);
  }, [kinect]);

  const handleFinish = () => {
    saveExercise(setRecord);
    // TODO:データの保存をawaitする
    setTimeout(() => {
      revokeVideoUrls(setRecord);
      setSetRecord(resetSet());
      setPhase(0);
    }, 1000);
  };

  return (
    // TICKET: videoUrlを設定する
    // TICKET: resultの中にURLを含める
    // TICKET: 指導項目に応じたビデオの方向を設定する
    <ResultForTrainer
      videoUrl={setRecord.repVideoUrls[0]}
      summaryDescription={setRecord.resultSummary.description}
      results={setRecord.checkResult}
      checkpoints={settings.checkpoints}
      handleBack={() => setPhase((prev) => prev - 1)}
      handleForward={handleFinish}
    />
  );
}
