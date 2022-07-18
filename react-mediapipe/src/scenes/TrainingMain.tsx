import { Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { TrainingContext } from './contexts';
import { ReportPhase, TrainingPhase } from './Phases';

export default function TrainingMain() {
    const [phase, setPhase] = useState<number>(0);
    const states = useMemo(() => ({ allState: phase, stateSetter: setPhase }), [phase]);

    return (
        <>
            <Typography fontWeight={600}>PHASE = {phase}</Typography>
            <TrainingContext.Provider value={states}>
                {phase === 0 && <TrainingPhase />}
                {phase === 1 && <ReportPhase />}
            </TrainingContext.Provider>
        </>
    );
}
