import { Landmark, LandmarkList } from '@mediapipe/pose';
import { drawBarsFromTwoPoints } from '../drawing_utils/thresholdBar';
import { angleInYZ, distanceInY, distanceInYZ, midpointBetween, normalizeWorldLandmarkPoint } from './pose';

// スクワットのお尻が十分に下がっているかチェックする用のラインを表示する
export const squatDepthCheckLine = (
  ctx: CanvasRenderingContext2D,
  current: HTMLCanvasElement,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  const KneesMidpoint: Landmark = midpointBetween(worldLandmarks[19], worldLandmarks[23]);
  const currentPoseKnee = midpointBetween(worldLandmarks[19], worldLandmarks[23]);
  const currentPosePelvisKneeDistanceYZ = distanceInYZ(worldLandmarks[0], currentPoseKnee);
  const upAngleKTR = (Math.PI * 9.0) / 180.0; // 9度は桂が指定
  const downAngleKTR = -(Math.PI * 9.0) / 180.0; // 9度は桂が指定;
  const squatDepthUpPoint: Landmark = {
    x: KneesMidpoint.x,
    y: KneesMidpoint.y - Math.sin(upAngleKTR) * currentPosePelvisKneeDistanceYZ,
    z: KneesMidpoint.z,
  };
  const squatDepthDownPoint: Landmark = {
    x: KneesMidpoint.x,
    y: KneesMidpoint.y - Math.sin(downAngleKTR) * currentPosePelvisKneeDistanceYZ,
    z: KneesMidpoint.z,
  };
  drawBarsFromTwoPoints(
    ctx,
    0.0,
    normalizeWorldLandmarkPoint(worldLandmarks, current, squatDepthUpPoint).y * height,
    10.0,
    normalizeWorldLandmarkPoint(worldLandmarks, current, squatDepthUpPoint).y * height,
    width,
    'red',
  );
  drawBarsFromTwoPoints(
    ctx,
    0.0,
    normalizeWorldLandmarkPoint(worldLandmarks, current, squatDepthDownPoint).y * height,
    10.0,
    normalizeWorldLandmarkPoint(worldLandmarks, current, squatDepthDownPoint).y * height,
    width,
    'green',
  );
};

// スクワットのお尻が十分に下がっているかチェックする用のデータを表示する
export const squatDepthCheckText = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  const currentPoseKnee = midpointBetween(worldLandmarks[19], worldLandmarks[23]);
  const currentPosePelvisKneeDistanceYZ = distanceInYZ(worldLandmarks[0], currentPoseKnee);
  const thighAngle = (angleInYZ(worldLandmarks[0], currentPoseKnee) * 180.0) / Math.PI;
  const currentPosePelvisKneeDistanceY = Math.abs(distanceInY(worldLandmarks[0], currentPoseKnee));

  ctx.font = '30px Times New Roman';
  ctx.fillStyle = 'red';
  ctx.fillText(`Squat`, 0.1 * width, 0.05 * height);

  const textKnee = `Knee: [${currentPoseKnee.x.toFixed(1).toString()},${currentPoseKnee.y
    .toFixed(1)
    .toString()},${currentPoseKnee.z.toFixed(1).toString()}]`;
  ctx.fillText(`${textKnee}`, 0.1 * width, 0.1 * height);

  const textPelvis = `Pelvis: [${worldLandmarks[0].x.toFixed(1).toString()},${worldLandmarks[0].y
    .toFixed(1)
    .toString()},${worldLandmarks[0].z.toFixed(1).toString()}]`;
  ctx.fillText(`${textPelvis}`, 0.1 * width, 0.2 * height);

  const textPelvisKneeDistanceYZ = `YZ平面での骨盤と膝の間の距離: ${currentPosePelvisKneeDistanceYZ
    .toFixed(1)
    .toString()}`;
  ctx.fillText(`${textPelvisKneeDistanceYZ}`, 0.1 * width, 0.3 * height);

  const textPelvisKneeDistanceY = `骨盤と膝のY座標の差: ${currentPosePelvisKneeDistanceY.toFixed(1).toString()}`;
  ctx.fillText(`${textPelvisKneeDistanceY}`, 0.1 * width, 0.4 * height);

  // const textThighAngle = `thighAngle: ${thighAngle.toFixed(1).toString()}`;
  const textThighAngle = `骨盤と膝を結ぶ直線がYZ平面上でY軸となす角: ${thighAngle.toFixed(1).toString()}`;
  ctx.fillText(`${textThighAngle}`, 0.1 * width, 0.5 * height);
};
