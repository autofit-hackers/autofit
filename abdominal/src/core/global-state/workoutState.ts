import { Exercise } from '../training-data/exercise';

export type WorkoutState = {
  exercise: Exercise | undefined;
  repCount: number;
};

export const resetWorkoutState = (): WorkoutState => ({
  exercise: undefined,
  repCount: 0,
});

export const updateWorkoutState = (prevState: WorkoutState): WorkoutState => {
  console.log('updateWorkoutState');

  return prevState;
};
