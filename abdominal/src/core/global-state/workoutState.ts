import { RepCountState } from 'src/core/workout-analysis/countReps';
import { ExerciseEstimationState } from '../workout-analysis/identifyExercise';
import { Exercise } from '../training-data/exercise';

export type WorkoutState = {
  exercise: Exercise | undefined;
  repCount: number;
};

export const getDefaultWorkoutState = (): WorkoutState => ({
  exercise: undefined,
  repCount: 0,
});

// 種目を確定した後、毎フレーム呼ばれる
export const updateWorkoutState = (
  prevState: WorkoutState,
  repCountState: RepCountState,
  exerciseEstimationState: ExerciseEstimationState,
): WorkoutState => {
  if (!exerciseEstimationState.determined) throw new Error('Exercise not determined');
  const exercise = prevState.exercise || exerciseEstimationState.determined;

  if (exercise === 'squat' || exercise === 'dead_lift') {
    return {
      exercise,
      repCount: repCountState.knee.count,
    };
  }

  return {
    exercise,
    repCount: repCountState.elbow.count,
  };
};
