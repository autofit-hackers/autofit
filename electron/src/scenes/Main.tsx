import { Button, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { stopKinect } from '../utils/kinect';
import { kinectAtom, phaseAtom } from './atoms';
import BodyTrack2d from './BodyTracking';
import IntervalReport from './Report';

export default function TrainingMain() {
  const [phase, setPhase] = useAtom(phaseAtom);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  return (
    <>
      <Typography fontWeight={600} zIndex={2} position="relative">
        PHASE = {phase}
      </Typography>
      {phase === 0 && (
        <>
          <Button
            variant="contained"
            onClick={() => {
              stopKinect(kinect);
              setPhase(1);
            }}
            sx={{ zIndex: 2 }}
          >
            Phase Ahead
          </Button>
          <BodyTrack2d />
        </>
      )}
      {phase === 1 && (
        <>
          <Button variant="contained" onClick={() => setPhase(0)}>
            Phase Back
          </Button>
          <IntervalReport />
        </>
      )}
    </>
  );
}
