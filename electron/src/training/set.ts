import { Rep } from './rep';

export type Set = { reps: Rep[]; RepNumbersToBeShown: { [instructionName: string]: number }; weight?: number };

export const resetSet = (): Set => ({ reps: [], RepNumbersToBeShown: {} });

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
