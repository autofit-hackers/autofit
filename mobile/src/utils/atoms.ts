import { atom } from 'jotai';
import { Trainer } from './training';

export const trainerAtom = atom<Trainer[] | undefined>(undefined);
export const nameAtom = atom('hoge');
