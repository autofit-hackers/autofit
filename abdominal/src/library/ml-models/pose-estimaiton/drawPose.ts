import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Results, POSE_CONNECTIONS } from '@mediapipe/pose';

const drawPose = (canvas: HTMLCanvasElement | null, results: Results, color: string) => {
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

export default drawPose;
