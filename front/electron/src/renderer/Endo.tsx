import { IpcReader, IpcSaver } from './IpcReader';
import IntervalReport from './Report';
import WebcamStreamCapture from './WebCamTest';

const EndoWorkSpace = () => {
  return (
    <>
      <WebcamStreamCapture />
      <IpcReader />
      <IpcSaver message="3142" />
      <IntervalReport
        trainingMenuName="スクワット"
        frontMoviePath="https://www.youtube.com/embed/muuK4SpRR5M"
        instructionText="膝が前に出ています"
      />
    </>
  );
};

export default EndoWorkSpace;
