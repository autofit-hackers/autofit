import { Exercise } from 'src/core/training-data/exercise';
import { getMidpoint, getAngleOfLine, getAngleOfThreePoints, MJ, Pose } from 'src/core/training-data/pose';

export type ExerciseEstimationState = {
  history: (Exercise | undefined)[];
  determined: Exercise | undefined;
};

const numFramesToDetermineExercise = 150; // 1sで約25frame

export const identifyExerciseByPose = (pose: Pose): Exercise | undefined => {
  const { worldLandmarks } = pose;
  const shoulderCenter = getMidpoint(worldLandmarks[11], worldLandmarks[12]);
  const hipCenter = getMidpoint(worldLandmarks[23], worldLandmarks[24]);
  const wristCenter = getMidpoint(worldLandmarks[15], worldLandmarks[16]);
  const kneeCenter = getMidpoint(worldLandmarks[25], worldLandmarks[26]);
  const upperBodyAngle = getAngleOfLine(hipCenter, shoulderCenter).z;
  const hipJointAngle = getAngleOfThreePoints(shoulderCenter, hipCenter, kneeCenter);

  // WARN: ハードコードもりもり
  if (upperBodyAngle < 50 || upperBodyAngle > 150) return 'bench_press';
  if (wristCenter.y < hipCenter.y + 5) return 'dead_lift';
  if (wristCenter.y > worldLandmarks[MJ.NOSE].y + 3) return 'shoulder_press';
  if (Math.abs(hipJointAngle) > 10) return 'squat';

  return undefined;
};

export const getMostFrequentExercise = (prevState: ExerciseEstimationState): Exercise => {
  // 一定フレーム数分の履歴を取得したら、その中で最も多く出現した種目を確定する。undefinedは除外する。
  const historyWithoutUndefined = prevState.history.filter((exercise) => exercise !== undefined) as Exercise[];
  const countedExercises = historyWithoutUndefined.reduce((acc, exercise) => {
    if (acc[exercise]) {
      acc[exercise] += 1;
    } else {
      acc[exercise] = 1;
    }

    return acc;
  }, {} as { [key in Exercise]: number });
  const mostFrequentExercise = Object.keys(countedExercises).reduce((acc, exercise) => {
    if (acc === undefined) {
      return exercise as Exercise;
    }
    if (countedExercises[exercise as Exercise] > countedExercises[acc]) {
      return exercise as Exercise;
    }

    return acc;
  }, undefined as Exercise | undefined);

  if (mostFrequentExercise === undefined) throw new Error('determinedExercise is undefined');

  return mostFrequentExercise;
};

export const updateExerciseEstimationState = (
  prevState: ExerciseEstimationState,
  pose: Pose,
): ExerciseEstimationState => {
  const currentState = prevState;
  const estimatedExerciseOfFrame = identifyExerciseByPose(pose);
  if (currentState.history.length < numFramesToDetermineExercise) {
    currentState.history.push(estimatedExerciseOfFrame);
  } else if (currentState.determined === undefined) {
    currentState.determined = getMostFrequentExercise(currentState);
  }

  return currentState;
};
