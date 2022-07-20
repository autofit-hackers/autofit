import { Rep } from './rep';

export type Set = { reps: Rep[]; weight?: number };

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
