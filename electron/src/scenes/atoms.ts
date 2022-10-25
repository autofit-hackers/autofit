import { atom } from 'jotai';
import { Checkpoint } from '../coaching/formEvaluation';
import backBent from '../coaching/squat/backBent';
import dropDepth from '../coaching/squat/dropDepth';
import kneeFrontBack from '../coaching/squat/kneeFrontBack';
import kneeInAndOut from '../coaching/squat/kneeInAndOut';
import velocity from '../coaching/squat/velocity';
import { resetSet, Set } from '../training_data/set';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export const phaseAtom = atom<number>(0);

export const setRecordAtom = atom<Set>(resetSet());

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const kinectAtom = atom<typeof KinectAzure>(new KinectAzure());

type Settings = { playSound: boolean; checkpoints: Checkpoint[]; isDebugMode: boolean };
export const settingsAtom = atom<Settings>({
  playSound: true,
  checkpoints: [dropDepth, velocity, kneeFrontBack, backBent, kneeInAndOut],
  isDebugMode: false,
});
