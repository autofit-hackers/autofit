import { Rep } from './rep';

export type Set = { reps: Rep[]; displayedRepNumbers: { [instruction: string]: number }; weight?: number };

export const resetSet = (): Set => ({ reps: [], displayedRepNumbers: {} });

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
