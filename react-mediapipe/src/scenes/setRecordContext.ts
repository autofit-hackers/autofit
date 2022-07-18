import { createContext } from 'react';
import { Set } from '../training/set';

export type SetRecord = { videoUrls: string[]; set: Set };
export const SetRecordContext = createContext(
    {} as {
        setRecord: SetRecord;
        setSetRecord: React.Dispatch<React.SetStateAction<SetRecord>>;
    }
);
