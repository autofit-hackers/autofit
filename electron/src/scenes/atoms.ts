import { atom } from 'jotai';
import { Set } from '../training/set';

export const phaseAtom = atom<number>(0);

export const repVideoUrlsAtom = atom<string[]>([]);
export const setRecordAtom = atom<Set>({ reps: [] });
export const acceptedErrorAtom = atom<number>(20);
