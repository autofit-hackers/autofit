import { getAngleOfThreePoints, MJ, Pose } from 'src/core/training-data/pose';

type Thresholds = { lower: number; upper: number };
type JointState = { count: number; hasJointBend: boolean };

export type RepCountState = {
  elbow: JointState;
  knee: JointState;
};

export const getDefaultRepCountState = (): RepCountState => ({
  elbow: { count: 0, hasJointBend: false },
  knee: { count: 0, hasJointBend: false },
});

const updateJointState = (prevState: JointState, angle: number, thresholds: Thresholds): JointState => {
  const currentState = prevState;
  if (prevState.hasJointBend) {
    if (angle > thresholds.upper) {
      currentState.hasJointBend = false;
      currentState.count += 1;
    }
  } else if (angle < thresholds.lower) {
    currentState.hasJointBend = true;
  }

  return currentState;
};

//  Called every frame
export const updateRepCountState = (
  prevState: RepCountState,
  pose: Pose,
  thresholds: Thresholds = { lower: 120, upper: 150 },
) => {
  const averageElbowAngle =
    (getAngleOfThreePoints(
      pose.worldLandmarks[MJ.LEFT_SHOULDER],
      pose.worldLandmarks[MJ.LEFT_ELBOW],
      pose.worldLandmarks[MJ.LEFT_WRIST],
    ) +
      getAngleOfThreePoints(
        pose.worldLandmarks[MJ.RIGHT_SHOULDER],
        pose.worldLandmarks[MJ.RIGHT_ELBOW],
        pose.worldLandmarks[MJ.RIGHT_WRIST],
      )) /
    2;

  const averageKneeAngle =
    (getAngleOfThreePoints(
      pose.worldLandmarks[MJ.RIGHT_HIP],
      pose.worldLandmarks[MJ.RIGHT_KNEE],
      pose.worldLandmarks[MJ.RIGHT_ANKLE],
    ) +
      getAngleOfThreePoints(
        pose.worldLandmarks[MJ.LEFT_HIP],
        pose.worldLandmarks[MJ.LEFT_KNEE],
        pose.worldLandmarks[MJ.LEFT_ANKLE],
      )) /
    2;

  const currentElbowState = updateJointState(prevState.elbow, averageElbowAngle, thresholds);
  const currentKneeState = updateJointState(prevState.knee, averageKneeAngle, thresholds);

  return { elbow: currentElbowState, knee: currentKneeState };
};
