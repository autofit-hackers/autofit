import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';

export type Pose = {
  landmark: NormalizedLandmarkList;
  worldLandmark: LandmarkList;
};

export const distanceBetween = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

export const midpointBetween = (
  p1: NormalizedLandmark | Landmark,
  p2: NormalizedLandmark | Landmark,
): NormalizedLandmark | Landmark => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
  z: (p1.z + p2.z) / 2,
});

export const heightInFrame = (pose: Pose): number => {
  // TODO: デバッグ用に目と肩のラインで代替しているので、プロダクションではコメントアウトされている処理に戻す
  // const nose = pose.landmark[11];
  // const ankle = midpointBetween(pose.landmark[20], pose.landmark[24]);
  // return distanceBetween(nose, ankle);

  const nose = pose.landmark[27];
  const neck = pose.landmark[3];

  return distanceBetween(nose, neck);
};

export const heightInWorld = (pose: Pose): number => {
  const neckWorld = pose.worldLandmark[27];
  const noseWorld = pose.worldLandmark[3];

  return distanceBetween(neckWorld, noseWorld);
};
