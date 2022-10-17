import { atom } from 'jotai';
import dropDepth from '../coaching/squat/dropDepth';
import kneeFrontBack from '../coaching/squat/kneeFrontBack';
import velocity from '../coaching/squat/velocity';
import { Checkpoint } from '../coaching/formEvaluation';
import { resetSet, Set } from '../training_data/set';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export const phaseAtom = atom<number>(0);

export const setRecordAtom = atom<Set>(resetSet());

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const kinectAtom = atom<typeof KinectAzure>(new KinectAzure());

type Settings = { playSound: boolean; checkpoints: Checkpoint[]; isDebugMode: boolean };
export const SettingsAtom = atom<Settings>({
  playSound: true,
  checkpoints: [dropDepth, kneeFrontBack, velocity],
  isDebugMode: false,
});
