import { Rep } from './rep';

export type Set = { reps: Rep[]; weight?: number };

export const appendRepToSet = (set: Set, rep: Rep): Set => {
    set.reps = [...set.reps, rep]; // use Non-destructive method like this

    return set;
};
