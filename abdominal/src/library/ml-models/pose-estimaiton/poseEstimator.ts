/* eslint-disable no-param-reassign */
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
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

export const drawPose = (canvas: HTMLCanvasElement | null, results: Results, color: string) => {
  if (canvas === null || results === null) return;

  const ctx = canvas.getContext('2d');
  if (ctx === null) return;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: 'white',
      lineWidth: 2,
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: 'white',
      lineWidth: 4,
      radius: 8,
      fillColor: color,
    });
  }
  ctx.restore();
};
