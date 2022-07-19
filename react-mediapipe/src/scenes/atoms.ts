import { atom } from 'jotai';
import { Set } from '../training/set';

export const phaseAtom = atom<number>(0);

export type SetRecord = { videoUrls: string[]; set: Set };
export const setRecordAtom = atom<SetRecord>({ videoUrls: [], set: { reps: [] } });
