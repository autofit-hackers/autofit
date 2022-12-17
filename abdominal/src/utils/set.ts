import { Rep } from './rep';

export type Set = {
  reps: Rep[];
};

export const resetSet = (): Set => ({
  reps: [],
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});
