import { getAngleOfThreePoints, MJ, Pose } from 'src/core/training-record/pose';

type Thresholds = { lower: number; upper: number };

export type RepCountState = {
  repCountForElbow: number;
  repCountForKnee: number;
  hasElbowJointBend: boolean;
  hasKneeJointBend: boolean;
};

export const getIsElbowJointBend = (pose: Pose, prevState: RepCountState, thresholds: Thresholds): void => {
  const { lower, upper } = thresholds;
  const currentState = prevState;
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

  if (!prevState.hasElbowJointBend) {
    if (averageElbowAngle < lower) {
      currentState.hasElbowJointBend = true;
    }
  } else if (averageElbowAngle > upper) {
    currentState.hasElbowJointBend = false;
    currentState.repCountForElbow += 1;
  }
};

export const getIsKneeJointBend = (pose: Pose, prevState: RepCountState, thresholds: Thresholds): void => {
  const { lower, upper } = thresholds;
  const currentState = prevState;

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

  if (!prevState.hasKneeJointBend) {
    if (averageKneeAngle < lower) {
      currentState.hasKneeJointBend = true;
    }
  } else if (averageKneeAngle > upper) {
    currentState.hasKneeJointBend = false;
    currentState.repCountForKnee += 1;
  }
};
