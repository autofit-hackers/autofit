import { getAngle, normalizeAngle, Pose } from '../training_data/pose';
import KJ from '../utils/kinectJoints';

export const getOpeningOfKnee = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).zx,
    true,
  );

export const getOpeningOfToe = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.ANKLE_LEFT], pose.worldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.ANKLE_RIGHT], pose.worldLandmarks[KJ.FOOT_RIGHT]).zx,
    true,
  );

export const getThighAngleFromSide = (pose: Pose): number => {
  const leftThighAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).yz,
    false,
  );
  const rightThighAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).yz,
    false,
  );
  const meanThighAngleFromSide = (leftThighAngleFromSide + rightThighAngleFromSide) / 2;

  return meanThighAngleFromSide;
};
