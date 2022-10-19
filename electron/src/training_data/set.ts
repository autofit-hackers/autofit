import type { CheckResult } from '../coaching/formEvaluation';
import { Rep } from './rep';

export type SetResultSummary = {
  totalScore: number;
  description: string;
  timeToComplete: number;
  calorieConsumption: number;
};

export type SetInfo = {
  userName: string;
  exerciseName: string;
  targetReps: number;
  targetWeight: number;
  startTime: string;
};

export type Set = {
  setInfo: SetInfo;
  reps: Rep[];
  checkResult: CheckResult[];
  resultSummary: SetResultSummary;
  repVideoUrls: string[];
  repVideoBlobs: Blob[];
};

export const revokeRepVideoUrls = (set: Set): void => {
  set.repVideoUrls.forEach((url) => URL.revokeObjectURL(url));
};

export const resetSet = (
  setInfo = { userName: '', exerciseName: '', targetReps: 0, targetWeight: 0, startTime: '' },
): Set => ({
  setInfo,
  reps: [],
  checkResult: [],
  resultSummary: { totalScore: 0, description: '', timeToComplete: 0, calorieConsumption: 0 },
  repVideoUrls: [],
  repVideoBlobs: [],
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
