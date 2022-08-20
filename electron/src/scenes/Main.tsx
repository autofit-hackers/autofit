import { Button } from '@mui/material';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import BodyTrack2d from './BodyTracking';
import IntervalReport from './Report';
import StartPage from './StartPage';

export default function TrainingMain() {
  const [phase, setPhase] = useAtom(phaseAtom);

  return (
    <>
      {phase === 0 && <StartPage />}
      {phase === 1 && (
        <>
          <Button
            variant="contained"
            onClick={() => {
              setPhase(2);
            }}
            sx={{ zIndex: 2 }}
          >
            Finish Training
          </Button>
          <BodyTrack2d />
        </>
      )}
      {phase === 2 && (
        <>
          <Button variant="contained" onClick={() => setPhase(1)}>
            Back to Training
          </Button>
          <IntervalReport />
        </>
      )}
    </>
  );
}
