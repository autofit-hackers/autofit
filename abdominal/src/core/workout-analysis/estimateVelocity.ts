import { Exercise } from 'src/core/training-data/exercise';
import { getDistance, Pose } from 'src/core/training-data/pose';

// WARN: worldLandmarksではなくlandmarksを使う
const getAnkleToShoulderLength = (pose: Pose): { left: number; right: number; mean: number } => {
  const leftShoulder = pose.imageLandmarks[11];
  const leftKnee = pose.imageLandmarks[25];
  const rightShoulder = pose.imageLandmarks[12];
  const rightKnee = pose.imageLandmarks[26];

  const leftLength = getDistance(leftShoulder, leftKnee).y;
  const rightLength = getDistance(rightShoulder, rightKnee).y;
  const mean = leftLength + rightLength / 2;

  return {
    left: leftLength,
    right: rightLength,
    mean,
  };
};

// WARN: worldLandmarksではなくlandmarksを使う
const getWristToShoulderLength = (pose: Pose): { left: number; right: number; mean: number } => {
  const leftShoulder = pose.imageLandmarks[11];
  const leftWrist = pose.imageLandmarks[15];
  const rightShoulder = pose.imageLandmarks[12];
  const rightWrist = pose.imageLandmarks[16];

  const leftArmLength = getDistance(leftShoulder, leftWrist).y;
  const rightArmLength = getDistance(rightShoulder, rightWrist).y;
  const mean = leftArmLength + rightArmLength / 2;

  return {
    left: leftArmLength,
    right: rightArmLength,
    mean,
  };
};

export const getJointsDistance = (pose: Pose, exercise: Exercise): number => {
  if (exercise === 'squat' || exercise === 'dead_lift') return getAnkleToShoulderLength(pose).mean;
  if (exercise === 'bench_press' || exercise === 'shoulder_press') return getWristToShoulderLength(pose).mean;

  return 0;
};

export const getLiftingVelocity = (prevPose: Pose, currentPose: Pose, exercise: Exercise): number => {
  const prevDistance = getJointsDistance(prevPose, exercise);
  const currentDistance = getJointsDistance(currentPose, exercise);
  const time = (currentPose.timestamp - prevPose.timestamp) / 1000; // 秒単位
  const velocity = Math.abs(currentDistance - prevDistance) / time; // 正の値でcm/s

  return velocity;
};
