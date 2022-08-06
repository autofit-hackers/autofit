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

export const kinectToMediapipe = (
  kinectPoses: Array<{
    cameraX: number;
    cameraY: number;
    cameraZ: number;
    colorX: number;
    colorY: number;
    confidence: number;
    depthX: number;
    depthY: number;
    index: number;
    orientationW: number;
    orientationX: number;
    orientationY: number;
    orientationZ: number;
  }>,
  canvas: HTMLCanvasElement,
  rotation: boolean,
): { landmarks: NormalizedLandmarkList; worldLandmarks: LandmarkList } => {
  const mediapipePose: NormalizedLandmarkList = [];
  const mediapipePoseWorld: LandmarkList = [];
  const depthToRGB = (Math.PI * 6) / 180.0;
  for (let i = 0; i < kinectPoses.length; i += 1) {
    mediapipePose[i] = { x: kinectPoses[i].colorX / canvas.width, y: kinectPoses[i].colorY / canvas.height, z: 0 };

    // Depthカメラがcolorカメラと比べ，Z軸が6度ずれているので補正
    if (rotation) {
      mediapipePoseWorld[i] = {
        x: kinectPoses[i].cameraX,
        y: kinectPoses[i].cameraY * Math.cos(depthToRGB) + kinectPoses[i].cameraZ * Math.sin(depthToRGB),
        z: kinectPoses[i].cameraY * Math.sin(-depthToRGB) + kinectPoses[i].cameraZ * Math.cos(depthToRGB),
      };
    } else {
      mediapipePoseWorld[i] = { x: kinectPoses[i].cameraX, y: kinectPoses[i].cameraY, z: kinectPoses[i].cameraZ };
    }
  }

  return { landmarks: mediapipePose, worldLandmarks: mediapipePoseWorld };
};

export type Pose = {
  landmarks: NormalizedLandmarkList;
  worldLandmarks: LandmarkList;
};

// 正負あり
export const distanceInX = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  p2.x - p1.x;

// 正負あり
export const distanceInY = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  p2.y - p1.y;

// 正負あり
export const distanceInZ = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  p2.z - p1.z;

export const distanceInXY = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

export const distanceInYZ = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.sqrt((p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);

export const distanceInZX = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.sqrt((p1.z - p2.z) ** 2 + (p1.x - p2.x) ** 2);

export const distanceInXYZ = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);

export const midpointBetween = (
  p1: NormalizedLandmark | Landmark,
  p2: NormalizedLandmark | Landmark,
): NormalizedLandmark | Landmark => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
  z: (p1.z + p2.z) / 2,
});

export const heightInFrame = (pose: Pose): number => {
  const nose = pose.landmarks[11];
  const ankle = midpointBetween(pose.landmarks[20], pose.landmarks[24]);

  return distanceInXY(nose, ankle);
};

export const heightInWorld = (pose: Pose): number => {
  const noseWorld = pose.worldLandmarks[11];
  const ankleWorld = midpointBetween(pose.worldLandmarks[20], pose.worldLandmarks[24]);

  return distanceInXY(noseWorld, ankleWorld);
};

// XY座標に投影した際のX軸の正の方向となす角
export const angleInXY = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.atan2(p2.y - p1.y, p2.x - p1.x);

// YZ座標に投影した際のY軸の正の方向となす角
export const angleInYZ = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.atan2(p2.z - p1.z, p2.y - p1.y);

// ZX座標に投影した際のZ軸の正の方向となす角
export const angleInZX = (p1: NormalizedLandmark | Landmark, p2: NormalizedLandmark | Landmark): number =>
  Math.atan2(p2.x - p1.x, p2.z - p1.z);

// Sideを描画するために行う座標変換
export const normalizeSideWorldLandmarkPoint = (
  worldLandmarks: LandmarkList,
  canvas: HTMLCanvasElement,
  LandmarkPoint: Landmark,
): NormalizedLandmark => {
  // const normalizedLandmarks: NormalizedLandmarkList = [];
  const lowCenterY = (worldLandmarks[20].y + worldLandmarks[24].y) / 2;
  const lowCenterZ = (worldLandmarks[20].z + worldLandmarks[24].z) / 2;
  const heightOfBody = 1500;

  return {
    x: ((LandmarkPoint.z - lowCenterZ) * canvas.height * 0.8) / canvas.width / heightOfBody + 0.5,
    y: ((LandmarkPoint.y - lowCenterY) * 0.8) / heightOfBody + 0.9,
    z: 0,
  };
};

export const normalizeSideSideWorldLandmarks = (
  worldLandmarks: LandmarkList,
  canvas: HTMLCanvasElement,
): NormalizedLandmarkList => {
  const normalizedLandmarks: NormalizedLandmarkList = [];

  for (let i = 0; i < worldLandmarks.length; i += 1) {
    normalizedLandmarks[i] = normalizeSideWorldLandmarkPoint(worldLandmarks, canvas, worldLandmarks[i]);
  }

  return normalizedLandmarks;
};

// Frontを描画するために行う座標返還
export const normalizeFrontWorldLandmarkPoint = (
  worldLandmarks: LandmarkList,
  canvas: HTMLCanvasElement,
  LandmarkPoint: Landmark,
): NormalizedLandmark => {
  const lowCenterX = (worldLandmarks[20].x + worldLandmarks[24].x) / 2;
  const lowCenterY = (worldLandmarks[20].y + worldLandmarks[24].y) / 2;
  const heightOfBody = 1500;

  return {
    x: ((LandmarkPoint.x - lowCenterX) * canvas.height * 0.8) / canvas.width / heightOfBody + 0.5,
    y: ((LandmarkPoint.y - lowCenterY) * 0.8) / heightOfBody + 0.9,
    z: 0,
  };
};

export const normalizeFrontWorldLandmarks = (
  worldLandmarks: LandmarkList,
  canvas: HTMLCanvasElement,
): NormalizedLandmarkList => {
  const normalizedLandmarks: NormalizedLandmarkList = [];

  for (let i = 0; i < worldLandmarks.length; i += 1) {
    normalizedLandmarks[i] = normalizeFrontWorldLandmarkPoint(worldLandmarks, canvas, worldLandmarks[i]);
  }

  return normalizedLandmarks;
};

export const copyLandmark = (normalizedLandmark: NormalizedLandmark): NormalizedLandmark => ({
  x: normalizedLandmark.x,
  y: normalizedLandmark.y,
  z: normalizedLandmark.z,
  visibility: normalizedLandmark.visibility,
});
