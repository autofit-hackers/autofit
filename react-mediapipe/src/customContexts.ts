import React, { createContext } from 'react';

export const TrainingContext = createContext(
    {} as {
        allState: number; // TODO: not only phase, but all states here
        stateSetter: React.Dispatch<React.SetStateAction<number>>;
    }
);

export const PhaseTestContext = createContext(
    {} as {
        p: number;
        setter: React.Dispatch<React.SetStateAction<number>>;
    }
);
