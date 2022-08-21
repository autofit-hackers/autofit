import { Rep } from './rep';

export type FormEvaluationResult = {
  name: string;
  descriptionsForEachRep: string[];
  overallComment: string;
  eachRepErrors: number[];
  score: number;
  bestRepIndex: number;
  worstRepIndex: number;
};

export type SetResult = {
  weight?: number;
  overallComment: string[];
};

export type Set = { reps: Rep[]; formEvaluationResults: FormEvaluationResult[]; setResult: SetResult };

export const resetSet = (): Set => ({
  reps: [],
  formEvaluationResults: [],
  setResult: { overallComment: [''] },
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
