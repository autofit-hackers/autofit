import type { SetEvaluationResult } from '../coaching/formInstruction';
import { Rep } from './rep';

export type SetSummary = {
  weight?: number;
  description: string[];
  totalScore: number;
};

export type Set = {
  reps: Rep[];
  formEvaluationResults: SetEvaluationResult[];
  summary: SetSummary;
  repVideoUrls: string[];
  repVideoBlobs: Blob[];
};

export const resetSet = (): Set => ({
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
