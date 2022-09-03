import { getAngle, KJ, normalizeAngle, Pose } from '../training_data/pose';

export const getOpeningOfKnee = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).zx,
    'positive-inferior',
  );

export const getOpeningOfToe = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.ANKLE_LEFT], pose.worldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.ANKLE_RIGHT], pose.worldLandmarks[KJ.FOOT_RIGHT]).zx,
    'positive-inferior',
  );

export const getThighAngleFromSide = (pose: Pose): number => {
  const leftThighAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).yz,
    'permit-negative-inferior',
  );
  const rightThighAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).yz,
    'permit-negative-inferior',
  );
  const meanThighAngleFromSide = (leftThighAngleFromSide + rightThighAngleFromSide) / 2;

  return meanThighAngleFromSide;
};
