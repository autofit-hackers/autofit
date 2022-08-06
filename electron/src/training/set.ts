import { Rep } from './rep';

export type Set = { reps: Rep[]; RepNumbersToBeShowed: { [instruction: string]: number }; weight?: number };

export const resetSet = (): Set => ({ reps: [], RepNumbersToBeShowed: {} });

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
