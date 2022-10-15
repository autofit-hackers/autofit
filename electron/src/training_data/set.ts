import type { InstructionItemResult } from '../coaching/formInstruction';
import { Rep } from './rep';

export type SetSummary = {
  weight?: number;
  description: string[];
  totalScore: number;
};

export type SetInfo = {
  userName: string;
  exerciseName: string;
  targetReps: number;
  targetWeight: number;
};

export type Set = {
  setInfo: SetInfo;
  reps: Rep[];
  formEvaluationResults: InstructionItemResult[];
  summary: SetSummary;
  repVideoUrls: string[];
  repVideoBlobs: Blob[];
};

export const resetSet = (setInfo = { userName: '', exerciseName: '', targetReps: 0, targetWeight: 0 }): Set => ({
  setInfo,
  reps: [],
  formEvaluationResults: [],
  summary: { description: [''], totalScore: 0 },
  repVideoUrls: [],
  repVideoBlobs: [],
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
