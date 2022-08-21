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

export type SetSummary = {
  weight?: number;
  description: string[];
};

export type Set = { reps: Rep[]; formEvaluationResults: FormEvaluationResult[]; summary: SetSummary };

export const resetSet = (): Set => ({
  reps: [],
  formEvaluationResults: [],
  summary: { description: [''] },
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
