import { useRef } from 'react';
import MainCamera from 'src/components/ui/MainCamera';
import { getDefaultWorkoutState } from 'src/core/workout-analysis/workoutState';

function WorkoutDebug() {
  const workoutState = useRef(getDefaultWorkoutState());

  return <MainCamera originalSize={{ width: 720, height: 480 }} workoutState={workoutState.current} />;
}

export default WorkoutDebug;
