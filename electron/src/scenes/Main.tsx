import { Button, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import BodyTrack2d from '../BodyTrack2d';
import { phaseAtom } from './atoms';
import IntervalReport from './Report';

export default function TrainingMain() {
  const [phase, setPhase] = useAtom(phaseAtom);

  return (
    <>
      <Typography fontWeight={600}>PHASE = {phase}</Typography>
      {phase === 0 && (
        <>
          <Button variant="contained" onClick={() => setPhase(1)}>
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
