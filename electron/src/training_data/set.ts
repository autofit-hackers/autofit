import { Rep } from './rep';

export type FormEvaluationResult = {
  name: string;
  descriptionsForEachRep?: string[];
  eachRepErrors: number[];
  score: number;
  bestRepIndex: number;
  worstRepIndex: number;
};

export type Set = { reps: Rep[]; formEvaluationResults: FormEvaluationResult[]; weight?: number };

export const resetSet = (): Set => ({
  reps: [],
  formEvaluationResults: [],
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
