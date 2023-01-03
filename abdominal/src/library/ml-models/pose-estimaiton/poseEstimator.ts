/* eslint-disable no-param-reassign */
import { Options, Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';

export const loadPoseEstimator = (options: Options, onResults: (results: Results) => void): PoseMediapipe => {
  const poseEstimator = new PoseMediapipe({
    locateFile: (file) => `./public/mediapipe-pose/${file}`,
  });
  poseEstimator.setOptions(options);
  poseEstimator.onResults(onResults);

  return poseEstimator;
};

export const sendFrameToPoseEstimator = async (
  poseEstimator: PoseMediapipe | undefined,
  canvas: HTMLCanvasElement,
) => {
  if (poseEstimator === undefined || canvas === null) return;
  await poseEstimator.send({ image: canvas });
};
