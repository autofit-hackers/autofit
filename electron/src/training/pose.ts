import {
  Landmark,
  LandmarkConnectionArray,
  LandmarkList,
  NormalizedLandmark,
  NormalizedLandmarkList,
} from '@mediapipe/pose';

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

export const KINECT_POSE_CONNECTIONS: LandmarkConnectionArray = [
  // 胴体
  [0, 1],
  [1, 2],
  // 左腕
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [7, 10],
  // 右腕
  [2, 11],
  [11, 12],
  [12, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [14, 17],
  // 左脚
  [0, 18],
  [18, 19],
  [19, 20],
  [20, 21],
  // 右脚
  [0, 22],
  [22, 23],
  [23, 24],
  [24, 25],
  // 首から顔
  [2, 3],
  [3, 26],
  [26, 27],
  [27, 28],
  [28, 29],
  [27, 30],
  [30, 31],
];

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
