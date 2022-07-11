import { Typography } from '@mui/material';
import React, { createContext, useState } from 'react';
import { CameraPhase, ReportPhase } from './scenes/Phases';

export const PhaseTestContext = createContext(
    {} as {
        p: number;
        setter: React.Dispatch<React.SetStateAction<number>>;
    }
);

export const TrainingContext = createContext(
    {} as {
        allState: number; // TODO: not only phase, but all states here
        stateSetter: React.Dispatch<React.SetStateAction<number>>;
    }
);

export const TrainingMain = () => {
    const [phase, setPhase] = useState<number>(0);

    return (
        <>
            <Typography fontWeight={600}>PHASE = {phase}</Typography>
            <TrainingContext.Provider value={{ allState: phase, stateSetter: setPhase }}>
                {phase === 0 && <CameraPhase />}
                {phase === 1 && <ReportPhase />}
            </TrainingContext.Provider>
        </>
    );
};
