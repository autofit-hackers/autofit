import { Exercise } from '../training-record/exercise';
import { getAngleOfThreePoints, MJ, Pose, identifyExerciseByPose } from '../training-record/pose';

const numFramesToDetermine = 100;

export type WorkoutState = {
  estimatedExercise: { eachRepHistory: (Exercise | undefined)[]; determined: Exercise | undefined }; // candidates: フレームごとに予測された種目の履歴、 determined: 確定した種目
  repCountForElbow: number;
  repCountForKnee: number;
  hasElbowJointBend: boolean;
  hasKneeJointBend: boolean;
};

export const resetWorkoutState = (): WorkoutState => ({
  estimatedExercise: { eachRepHistory: [], determined: undefined },
  repCountForElbow: 0,
  repCountForKnee: 0,
  hasElbowJointBend: false,
  hasKneeJointBend: false,
});

export const updateWorkoutState = (prevState: WorkoutState, pose: Pose): WorkoutState => {
  const currentState = prevState;

  // レップカウント
  const { lower, upper } = { lower: 120, upper: 160 }; // TODO: resolve hard-coded values
  const leftElbowAngle = getAngleOfThreePoints(
    pose.worldLandmarks[MJ.LEFT_SHOULDER],
    pose.worldLandmarks[MJ.LEFT_ELBOW],
    pose.worldLandmarks[MJ.LEFT_WRIST],
  );
  const rightElbowAngle = getAngleOfThreePoints(
    pose.worldLandmarks[MJ.RIGHT_SHOULDER],
    pose.worldLandmarks[MJ.RIGHT_ELBOW],
    pose.worldLandmarks[MJ.RIGHT_WRIST],
  );
  const averageElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
  const leftKneeAngle = getAngleOfThreePoints(
    pose.worldLandmarks[MJ.LEFT_HIP],
    pose.worldLandmarks[MJ.LEFT_KNEE],
    pose.worldLandmarks[MJ.LEFT_ANKLE],
  );
  const rightKneeAngle = getAngleOfThreePoints(
    pose.worldLandmarks[MJ.RIGHT_HIP],
    pose.worldLandmarks[MJ.RIGHT_KNEE],
    pose.worldLandmarks[MJ.RIGHT_ANKLE],
  );
  const averageKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  if (!prevState.hasElbowJointBend) {
    if (averageElbowAngle < lower) {
      currentState.hasElbowJointBend = true;
    }
  } else if (averageElbowAngle > upper) {
    currentState.hasElbowJointBend = false;
    currentState.repCountForElbow += 1;
  }

  if (!prevState.hasKneeJointBend) {
    if (averageKneeAngle < lower) {
      currentState.hasKneeJointBend = true;
    }
  } else if (averageKneeAngle > upper) {
    currentState.hasKneeJointBend = false;
    currentState.repCountForKnee += 1;
  }

  // 種目推定
  const estimatedExerciseOfFrame = identifyExerciseByPose(pose);
  if (currentState.estimatedExercise.eachRepHistory.length < numFramesToDetermine) {
    currentState.estimatedExercise.eachRepHistory.push(estimatedExerciseOfFrame);
  } else if (currentState.estimatedExercise.determined === undefined) {
    // 一定フレーム数分の履歴を取得したら、その中で最も多く出現した種目を確定する。undefinedは除外する。
    const historyWithoutUndefined = currentState.estimatedExercise.eachRepHistory.filter(
      (exercise) => exercise !== undefined,
    ) as Exercise[];
    const countedExercises = historyWithoutUndefined.reduce((acc, exercise) => {
      if (acc[exercise]) {
        acc[exercise] += 1;
      } else {
        acc[exercise] = 1;
      }

      return acc;
    }, {} as { [key in Exercise]: number });
    const determinedExercise = Object.keys(countedExercises).reduce((acc, exercise) => {
      if (acc === undefined) {
        return exercise as Exercise;
      }
      if (countedExercises[exercise as Exercise] > countedExercises[acc]) {
        return exercise as Exercise;
      }

      return acc;
    }, undefined as Exercise | undefined);
    currentState.estimatedExercise.determined = determinedExercise;
  }

  return currentState;
};
