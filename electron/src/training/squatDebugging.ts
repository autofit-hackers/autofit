import { Landmark, LandmarkList } from '@mediapipe/pose';
import { drawBarsFromTwoPoints } from '../drawing_utils/thresholdBar';
import {
  angleInXY,
  angleInYZ,
  angleInZX,
  distanceInXYZ,
  distanceInY,
  distanceInYZ,
  midpointBetween,
  normalizeAboveWorldLandmarkPoint,
  normalizeSideWorldLandmarkPoint,
} from './pose';

// スクワットのお尻が十分に下がっているかチェックする用のラインを表示する
export const showLineToCheckSquatDepth = (
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
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, squatDepthUpPoint).y * height,
    10.0,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, squatDepthUpPoint).y * height,
    width,
    'red',
  );
  drawBarsFromTwoPoints(
    ctx,
    0.0,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, squatDepthDownPoint).y * height,
    10.0,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, squatDepthDownPoint).y * height,
    width,
    'green',
  );
};

// スクワットのお尻が十分に下がっているかチェックする用のデータを表示する
export const showTextToCheckSquatDepth = (
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
  ctx.fillText(`Squat Depth`, 0.1 * width, 0.05 * height);

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

// スクワットのニーイン，ニーアウトをチェックする用のデータを表示する
export const showLineToCheckKneeInOut = (
  ctx: CanvasRenderingContext2D,
  current: HTMLCanvasElement,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  // const bottomPoseLeftThighAngleZX = angleInZX(worldLandmarks[18], worldLandmarks[19]);
  // const bottomPoseRightThighAngleZX = angleInZX(worldLandmarks[22], worldLandmarks[23]);
  const bottomPoseLeftFootAngleZX = angleInZX(worldLandmarks[20], worldLandmarks[21]);
  const bottomPoseRightFootAngleZX = angleInZX(worldLandmarks[24], worldLandmarks[25]);

  // TODO: 桂以外の人でも判定できるようにする
  const inAngleKTR = (Math.PI * 12.0) / 180.0; // 12度は桂が指定
  const outAngleKTR = -(Math.PI * 12.0) / 180.0; // 12度は桂が指定;
  const squatLeftKneeIn: Landmark = {
    x: worldLandmarks[18].x + 10.0 * Math.sin(inAngleKTR + bottomPoseLeftFootAngleZX),
    y: worldLandmarks[18].y,
    z: worldLandmarks[18].z + 10.0 * Math.cos(inAngleKTR + bottomPoseLeftFootAngleZX),
  };
  const squatLeftKneeOut: Landmark = {
    x: worldLandmarks[18].x + 10.0 * Math.sin(outAngleKTR + bottomPoseLeftFootAngleZX),
    y: worldLandmarks[18].y,
    z: worldLandmarks[18].z + 10.0 * Math.cos(outAngleKTR + bottomPoseLeftFootAngleZX),
  };
  const squatRightKneeIn: Landmark = {
    x: worldLandmarks[22].x + 10.0 * Math.sin(-inAngleKTR + bottomPoseRightFootAngleZX),
    y: worldLandmarks[22].y,
    z: worldLandmarks[22].z + 10.0 * Math.cos(-inAngleKTR + bottomPoseRightFootAngleZX),
  };
  const squatRightKneeOut: Landmark = {
    x: worldLandmarks[22].x + 10.0 * Math.sin(-outAngleKTR + bottomPoseRightFootAngleZX),
    y: worldLandmarks[22].y,
    z: worldLandmarks[22].z + 10.0 * Math.cos(-outAngleKTR + bottomPoseRightFootAngleZX),
  };

  // 左太股
  drawBarsFromTwoPoints(
    ctx,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[18]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[18]).y * height,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[19]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[19]).y * height,
    width,
    'red',
  );
  // // 左つま先
  // drawBarsFromTwoPoints(
  //   ctx,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[20]).x * width,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[20]).y * height,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[21]).x * width,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[21]).y * height,
  //   width,
  //   'purple',
  // );
  // 左ニーイン
  drawBarsFromTwoPoints(
    ctx,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[18]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[18]).y * height,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatLeftKneeIn).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatLeftKneeIn).y * height,
    width,
    'green',
  );
  // 左ニーアウト
  drawBarsFromTwoPoints(
    ctx,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[18]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[18]).y * height,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatLeftKneeOut).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatLeftKneeOut).y * height,
    width,
    'green',
  );
  // 右太股
  drawBarsFromTwoPoints(
    ctx,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[22]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[22]).y * height,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[23]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[23]).y * height,
    width,
    'red',
  );
  // // 右つま先
  // drawBarsFromTwoPoints(
  //   ctx,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[24]).x * width,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[24]).y * height,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[25]).x * width,
  //   normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[25]).y * height,
  //   width,
  //   'purple',
  // );
  // 右ニーイン
  drawBarsFromTwoPoints(
    ctx,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[22]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[22]).y * height,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatRightKneeIn).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatRightKneeIn).y * height,
    width,
    'green',
  );
  // 右ニーアウト
  drawBarsFromTwoPoints(
    ctx,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[22]).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[22]).y * height,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatRightKneeOut).x * width,
    normalizeAboveWorldLandmarkPoint(worldLandmarks, current, squatRightKneeOut).y * height,
    width,
    'green',
  );
};

// スクワットのニーイン，ニーアウトをチェックする用のデータを表示する
export const showTextToCheckKneeInOut = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  const leftHipToKneeAngleZX = (angleInZX(worldLandmarks[18], worldLandmarks[19]) * 180.0) / Math.PI;
  const rightHipToKneeAngleZX = (angleInZX(worldLandmarks[22], worldLandmarks[23]) * 180.0) / Math.PI;
  const leftPelvisToKneeAngleZX = (angleInZX(worldLandmarks[0], worldLandmarks[19]) * 180.0) / Math.PI;
  const rightPelvisToKneeAngleZX = (angleInZX(worldLandmarks[0], worldLandmarks[23]) * 180.0) / Math.PI;
  const leftAnkleToFootAngleZX = (angleInZX(worldLandmarks[20], worldLandmarks[21]) * 180.0) / Math.PI;
  const rightAnkleToFootAngleZX = (angleInZX(worldLandmarks[24], worldLandmarks[25]) * 180.0) / Math.PI;

  const leftThighFootAngleDistanceZX = leftHipToKneeAngleZX - leftAnkleToFootAngleZX;
  const rightThighFootAngleDistanceZX = rightHipToKneeAngleZX - rightAnkleToFootAngleZX;

  ctx.font = '30px Times New Roman';
  ctx.fillStyle = 'red';
  ctx.fillText(`Squat Knee in or out`, 0.1 * width, 0.05 * height);

  const textLeftHipToKneeAngleZX = `左の太股の付け根から膝のZX座標角度: [${leftHipToKneeAngleZX
    .toFixed(1)
    .toString()}]`;
  ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.1 * width, 0.1 * height);

  const textRightHipToKneeAngleZX = `右の太股の付け根から膝のZX座標角度: [${rightHipToKneeAngleZX
    .toFixed(1)
    .toString()}]`;
  ctx.fillText(`${textRightHipToKneeAngleZX}`, 0.1 * width, 0.2 * height);

  const textLeftPelvisToKneeAngleZX = `左の骨盤から膝のZX座標角度: [${leftPelvisToKneeAngleZX.toFixed(1).toString()}]`;
  ctx.fillText(`${textLeftPelvisToKneeAngleZX}`, 0.1 * width, 0.3 * height);

  const textRightPelvisToKneeAngleZX = `右の骨盤から膝のZX座標角度: [${rightPelvisToKneeAngleZX
    .toFixed(1)
    .toString()}]`;
  ctx.fillText(`${textRightPelvisToKneeAngleZX}`, 0.1 * width, 0.4 * height);

  const textLeftAnkleToFootAngleZX = `左のつま先のZX座標角度: [${leftAnkleToFootAngleZX.toFixed(1).toString()}]`;
  ctx.fillText(`${textLeftAnkleToFootAngleZX}`, 0.1 * width, 0.5 * height);

  const textRightAnkleToFootAngleZX = `右のつま先のZX座標角度: [${rightAnkleToFootAngleZX.toFixed(1).toString()}]`;
  ctx.fillText(`${textRightAnkleToFootAngleZX}`, 0.1 * width, 0.6 * height);

  const textAnkleToFootAngleDistanceZX = `左右それぞれの太股とつま先のZX平面の角度差: [${leftThighFootAngleDistanceZX
    .toFixed(1)
    .toString()}], [${rightThighFootAngleDistanceZX.toFixed(1).toString()}]`;
  ctx.fillText(`${textAnkleToFootAngleDistanceZX}`, 0.1 * width, 0.7 * height);
};

// スクワットの背中が曲がっていないかをチェックする用のラインを表示する
export const showLineToCheckBackBent = (
  ctx: CanvasRenderingContext2D,
  current: HTMLCanvasElement,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  drawBarsFromTwoPoints(
    ctx,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[0]).x * width,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[0]).y * height,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[1]).x * width,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[1]).y * height,
    width,
    'red',
  );
  drawBarsFromTwoPoints(
    ctx,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[1]).x * width,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[1]).y * height,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[2]).x * width,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[2]).y * height,
    width,
    'red',
  );
  drawBarsFromTwoPoints(
    ctx,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[2]).x * width,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[2]).y * height,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[3]).x * width,
    normalizeSideWorldLandmarkPoint(worldLandmarks, current, worldLandmarks[3]).y * height,
    width,
    'red',
  );
};
// スクワットの背中が曲がっていないかをチェックする用のデータを表示する
export const showTextToCheckBackBent = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  const pelvisToSpineNavalAngleYZ = (angleInYZ(worldLandmarks[0], worldLandmarks[1]) * 180.0) / Math.PI;
  const pelvisToSpineNavalAngleXY = (angleInXY(worldLandmarks[0], worldLandmarks[1]) * 180.0) / Math.PI;
  const spineNavalToSpineChestAngleYZ = (angleInYZ(worldLandmarks[1], worldLandmarks[2]) * 180.0) / Math.PI;
  const spineNavalToSpineChestAngleXY = (angleInXY(worldLandmarks[1], worldLandmarks[2]) * 180.0) / Math.PI;
  const spineChestToNeckAngleYZ = (angleInYZ(worldLandmarks[2], worldLandmarks[3]) * 180.0) / Math.PI;
  const spineChestToNeckAngleXY = (angleInXY(worldLandmarks[2], worldLandmarks[3]) * 180.0) / Math.PI;

  // const backSlopeSquareAverageAngleXY =
  //   (pelvisToSpineNavalAngleXY - spineNavalToSpineChestAngleXY) ** 2 +
  //   (spineNavalToSpineChestAngleXY - spineChestToNeckAngleXY) ** 2;
  // const backSlopeSquareAverageAngleYZ =
  //   (pelvisToSpineNavalAngleYZ - spineNavalToSpineChestAngleYZ) ** 2 +
  //   (spineNavalToSpineChestAngleYZ - spineChestToNeckAngleYZ) ** 2;
  // const backSlopeSquareAverageAngleXY = (backSlopeSquareAverageAngleXY + backSlopeSquareAverageAngleYZ) / 2;

  ctx.font = '20px Times New Roman';
  ctx.fillStyle = 'red';
  ctx.fillText(`Squat Knee in or out`, 0.6 * width, 0.05 * height);

  const textPelvisToSpineNavalAngle = `下背部のXY・YZ座標角度: [${pelvisToSpineNavalAngleXY
    .toFixed(1)
    .toString()}], [${pelvisToSpineNavalAngleYZ.toFixed(1).toString()}]`;
  ctx.fillText(`${textPelvisToSpineNavalAngle}`, 0.6 * width, 0.1 * height);

  const textSpineNavalToSpineChestAngle = `中背部のXY・YZ座標角度: [${spineNavalToSpineChestAngleXY
    .toFixed(1)
    .toString()}], [${spineNavalToSpineChestAngleYZ.toFixed(1).toString()}]`;
  ctx.fillText(`${textSpineNavalToSpineChestAngle}`, 0.6 * width, 0.2 * height);

  const textSpineChestToNeckAngle = `上背部のXY・YZ座標角度: [${spineChestToNeckAngleXY
    .toFixed(1)
    .toString()}], [${spineChestToNeckAngleYZ.toFixed(1).toString()}]`;
  ctx.fillText(`${textSpineChestToNeckAngle}`, 0.6 * width, 0.3 * height);

  // const textLeftHipToKneeAngleZX = `下背部のXY座標角度: [${leftHipToKneeAngleZX.toFixed(1).toString()}]`;
  // ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.6 * width, 0.1 * height);

  // const textLeftHipToKneeAngleZX = `中背部のXY座標角度: [${leftHipToKneeAngleZX.toFixed(1).toString()}]`;
  // ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.6 * width, 0.2 * height);

  // const textLeftHipToKneeAngleZX = `上背部のXY座標角度: [${leftHipToKneeAngleZX.toFixed(1).toString()}]`;
  // ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.6 * width, 0.3 * height);

  // const textLeftHipToKneeAngleZX = `下背部のYZ座標角度: [${leftHipToKneeAngleZX.toFixed(1).toString()}]`;
  // ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.6 * width, 0.4 * height);

  // const textLeftHipToKneeAngleZX = `中背部のYZ座標角度: [${leftHipToKneeAngleZX.toFixed(1).toString()}]`;
  // ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.6 * width, 0.5 * height);

  // const textLeftHipToKneeAngleZX = `上背部のYZ座標角度: [${leftHipToKneeAngleZX.toFixed(1).toString()}]`;
  // ctx.fillText(`${textLeftHipToKneeAngleZX}`, 0.6 * width, 0.6 * height);
};

// スクワットの足が浮いていないかをチェックする用のデータを表示する
export const showTextToCheckSquatFeetGround = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  const FootAnkleDistance =
    (distanceInXYZ(worldLandmarks[20], worldLandmarks[21]) + distanceInXYZ(worldLandmarks[24], worldLandmarks[25])) /
    2;
  ctx.font = '30px Times New Roman';
  ctx.fillStyle = 'red';
  ctx.fillText(`Squat Feet Ground`, 0.1 * width, 0.05 * height);

  const textLeftFoot = `Foot_Left: [${worldLandmarks[21].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textLeftFoot}`, 0.1 * width, 0.1 * height);

  const textRightFoot = `Foot_Right: [${worldLandmarks[25].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textRightFoot}`, 0.1 * width, 0.2 * height);

  const textLeftAnkle = `Ankle_Left: [${worldLandmarks[20].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textLeftAnkle}`, 0.1 * width, 0.3 * height);

  const textRightAnkle = `Ankle_Right: [${worldLandmarks[24].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textRightAnkle}`, 0.1 * width, 0.4 * height);

  const textFootAnkleDistance = `つま先と踵の距離: [${FootAnkleDistance.toFixed(1).toString()}]`;
  ctx.fillText(`${textFootAnkleDistance}`, 0.1 * width, 0.5 * height);
};

// スクワットの足の幅をチェックする用のデータを表示する
export const showTextToCheckSquatFeetWidth = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  worldLandmarks: LandmarkList,
): void => {
  const currentPoseAnkleCenter = midpointBetween(worldLandmarks[20], worldLandmarks[24]);
  const currentPoseShoulderCenter = midpointBetween(worldLandmarks[5], worldLandmarks[12]);

  ctx.font = '30px Times New Roman';
  ctx.fillStyle = 'red';
  ctx.fillText(`Squat Feet Width`, 0.1 * width, 0.05 * height);

  const textLeftShoulder = `Shoulder_LeftのX座標: [${worldLandmarks[5].x.toFixed(1).toString()}]`;
  ctx.fillText(`${textLeftShoulder}`, 0.1 * width, 0.1 * height);

  const textRightShoulder = `Shoulder_RightのX座標: [${worldLandmarks[12].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textRightShoulder}`, 0.1 * width, 0.2 * height);

  const textLeftAnkle = `Ankle_LeftのX座標: [${worldLandmarks[20].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textLeftAnkle}`, 0.1 * width, 0.3 * height);

  const textRightAnkle = `Ankle_RightのX座標: [${worldLandmarks[24].y.toFixed(1).toString()}]`;
  ctx.fillText(`${textRightAnkle}`, 0.1 * width, 0.4 * height);

  const textShoulderCenter = `肩の中心のX座標: [${currentPoseShoulderCenter.x.toFixed(1).toString()}]`;
  ctx.fillText(`${textShoulderCenter}`, 0.1 * width, 0.5 * height);

  const textAnkleCenter = `足首の中心のX座標: [${currentPoseAnkleCenter.x.toFixed(1).toString()}]`;
  ctx.fillText(`${textAnkleCenter}`, 0.1 * width, 0.6 * height);
};
