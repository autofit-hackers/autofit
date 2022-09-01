import { Button } from '@mui/material';
import { useAtom } from 'jotai';
import { playTrainingEndSound } from '../coaching/voiceGuidance';
import { phaseAtom, playSoundAtom } from './atoms';
import BodyTrack2d from './BodyTracking';
import IntervalReport from './Report';
import StartPage from './StartPage';
import ProductMenu from './ui-components/ProductMenu';

export default function TrainingMain() {
  const [phase, setPhase] = useAtom(phaseAtom);
  const [playSound] = useAtom(playSoundAtom);

  return (
    <>
      <ProductMenu />
      {phase === 0 && <StartPage />}
      {phase === 1 && (
        <>
          <Button
            variant="contained"
            onClick={() => {
              setPhase(2);
              playTrainingEndSound(playSound);
            }}
            sx={{ zIndex: 2 }}
          >
            Finish Training
          </Button>
          <BodyTrack2d />
        </>
      )}
      {phase === 2 && <IntervalReport />}
    </>
  );
}
