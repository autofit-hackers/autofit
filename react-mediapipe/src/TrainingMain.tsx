import { Button, Typography } from '@mui/material';
import React, { createContext, useState } from 'react';
import { SetButton2 } from './ComponentSandbox';
import PoseStream from './pose_estimation/PoseStream';

export const PhaseTestContext = createContext(
    {} as {
        p: number;
        setter: React.Dispatch<React.SetStateAction<number>>;
    }
);

export const TrainingMain = () => {
    const [phase, setPhase] = useState<number>(0);

    return (
        <>
            <Typography fontWeight={600}>PHASE = {phase}</Typography>
            {phase === 0 && (
                <>
                    <PhaseTestContext.Provider value={{ p: phase, setter: setPhase }}>
                        <SetButton2 />
                    </PhaseTestContext.Provider>
                    <PoseStream />
                </>
            )}
            {phase === 1 && <Button onClick={() => setPhase(0)}>why japanese people</Button>}

            {/* <PhaseTestContext.Provider value={{ allState: phase, setAllState: setPhase }}>
                {phase === 1 && <P1 />}
                {phase === 2 && <P2 />}
                {phase === 3 && <P3 />}
            </PhaseTestContext.Provider> */}
        </>
    );
};
