import { atom } from 'jotai';
import { InstructionItem } from '../coaching/formInstruction';
import kneeFrontAndBack from '../coaching/squat-form-instructions/kneeFrontAndBack';
import kneeInAndOut from '../coaching/squat-form-instructions/kneeInAndOut';
import squatDepth from '../coaching/squat-form-instructions/squatDepth';
import squatVelocity from '../coaching/squat-form-instructions/squatVelocity';
import stanceWidth from '../coaching/squat-form-instructions/stanceWidth';
import { resetSet, Set } from '../training_data/set';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export const phaseAtom = atom<number>(0);

export const formInstructionItemsAtom = atom<InstructionItem[]>([
  squatDepth,
  kneeInAndOut,
  stanceWidth,
  kneeFrontAndBack,
  squatVelocity,
]);

export const setRecordAtom = atom<Set>(resetSet());

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
export const kinectAtom = atom<typeof KinectAzure>(new KinectAzure());

export const playSoundAtom = atom<boolean>(true);

export const formDebugAtom = atom<boolean>(false);
