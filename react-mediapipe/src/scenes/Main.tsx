import { Button, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import Realtime from './Realtime';
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
                    <Realtime doPlaySound={false} />
                </>
            )}
            {phase === 1 && (
                <>
                    <Button variant="contained" onClick={() => setPhase(0)}>
                        Phase Back
                    </Button>
                    <IntervalReport
                        trainingMenuName="aaa"
                        frontMoviePath="https://www.youtube.com/embed/muuK4SpRR5M"
                        instructionText="bbb"
                    />
                </>
            )}
        </>
    );
}
