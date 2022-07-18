import React, { createContext } from 'react';
import { Set } from '../training/set';

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

export type SetRecord = { videoUrls: string[]; set: Set };
export const SetRecordContext = createContext(
    {} as {
        setRecord: SetRecord;
        setSetRecord: React.Dispatch<React.SetStateAction<SetRecord>>;
    }
);
