import { IpcReader, IpcSaver } from './IpcReader';
import IntervalReport from './Report';

const EndoWorkSpace = () => {
  return (
    <>
      <IpcReader />
      <IpcSaver />
      <IntervalReport
        trainingMenuName="スクワット"
        frontMoviePath="https://www.youtube.com/embed/muuK4SpRR5M"
        instructionText="膝が前に出ています"
      />
    </>
  );
};

export default EndoWorkSpace;
