import { atom } from 'jotai';
import { FormInstructionItem, formInstructionItemsQWS } from '../coaching/formInstructionItems';
import { resetSet, Set } from '../training_data/set';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export const phaseAtom = atom<number>(1);

export const repVideoUrlsAtom = atom<string[]>([]);

export const formInstructionItemsAtom = atom<FormInstructionItem[]>(formInstructionItemsQWS);

export const setRecordAtom = atom<Set>(resetSet());

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const kinectAtom = atom<typeof KinectAzure>(new KinectAzure());

export const playSoundAtom = atom<boolean>(true);

export const formDebugAtom = atom<boolean>(false);
