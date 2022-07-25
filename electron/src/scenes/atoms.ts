import { atom } from 'jotai';
import { Set } from '../training/set';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export const phaseAtom = atom<number>(0);

export const repVideoUrlsAtom = atom<string[]>([]);
export const setRecordAtom = atom<Set>({ reps: [] });

// KinectAzure
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const kinect = new KinectAzure();
export const kinectAtom = atom<typeof KinectAzure>(kinect);
