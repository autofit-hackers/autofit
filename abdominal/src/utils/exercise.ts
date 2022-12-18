import {
  getAngleOfLine,
  getAngleOfThreePoints,
  getArmLength,
  getLengthAnkleToShoulder,
  getMidpoint,
  MJ,
  Pose,
} from './pose';

export type Exercise = {
  name: string;
  repCountThresholds: { lower: number; upper: number };
  getInterestJointsDistance: (pose: Pose) => number;
};

export const squat: Exercise = {
  name: 'squat',
  repCountThresholds: { lower: 0.8, upper: 0.95 },
  getInterestJointsDistance: (pose: Pose) => getLengthAnkleToShoulder(pose).mean,
};

export const benchPress: Exercise = {
  name: 'bench_press',
  repCountThresholds: { lower: 0.8, upper: 0.95 },
  getInterestJointsDistance: (pose: Pose) => getArmLength(pose).mean,
};

export const deadLift: Exercise = {
  name: 'dead_lift',
  repCountThresholds: { lower: 0.8, upper: 0.95 },
  getInterestJointsDistance: (pose: Pose) => getLengthAnkleToShoulder(pose).mean,
};

export const shoulderPress: Exercise = {
  name: 'shoulder_press',
  repCountThresholds: { lower: 0.8, upper: 0.95 },
  getInterestJointsDistance: (pose: Pose) => getArmLength(pose).mean,
};

export const pullUp: Exercise = {
  name: 'pull_up',
  repCountThresholds: { lower: 0.8, upper: 0.95 },
  getInterestJointsDistance: (pose: Pose) => getArmLength(pose).mean,
};

export const identifyExercise = (pose: Pose): Exercise | 'unknown' => {
  const { worldLandmarks } = pose;
  const shoulderCenter = getMidpoint(worldLandmarks[11], worldLandmarks[12]);
  const hipCenter = getMidpoint(worldLandmarks[23], worldLandmarks[24]);
  const wristCenter = getMidpoint(worldLandmarks[15], worldLandmarks[16]);
  const kneeCenter = getMidpoint(worldLandmarks[25], worldLandmarks[26]);
  const upperBodyAngle = getAngleOfLine(hipCenter, shoulderCenter).z;
  const hipJointAngle = getAngleOfThreePoints(shoulderCenter, hipCenter, kneeCenter);

  // WARN: ハードコードもりもり
  if (upperBodyAngle < 50 || upperBodyAngle > 150) return benchPress;
  if (wristCenter.y < hipCenter.y + 5) return deadLift;
  if (wristCenter.y > worldLandmarks[MJ.NOSE].y + 3) return shoulderPress;
  if (Math.abs(hipJointAngle) > 10) return squat;

  return 'unknown';
};
