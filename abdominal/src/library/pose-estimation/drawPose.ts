import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import { Pose } from 'src/core/training-data/pose';

const drawPose = (canvas: HTMLCanvasElement | null, pose: Pose, color: string) => {
  if (canvas === null || pose === null) return;

  const ctx = canvas.getContext('2d');
  if (ctx === null) return;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawConnectors(ctx, pose.imageLandmarks, POSE_CONNECTIONS, {
    color: 'white',
    lineWidth: 2,
  });
  drawLandmarks(ctx, pose.imageLandmarks, {
    color: 'white',
    lineWidth: 4,
    radius: 8,
    fillColor: color,
  });
  ctx.restore();
};

export default drawPose;
