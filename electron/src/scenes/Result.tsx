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
    <ResultForTrainer
      videoUrl="https://www.youtube.com/watch?v=Q8TXgCzxEnw"
      summaryDescription="今回のトレーニング結果は、ひざの開きが50%、背筋の張りが50%でした。"
      results={setRecord.checkResult}
      checkpoints={settings.checkpoints}
      handleBack={() => setPhase((prev) => prev - 1)}
      handleForward={handleFinish}
    />
  );
}
