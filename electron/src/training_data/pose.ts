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

export type GridDelta = { x: number; y: number; z: number };

export const translateLandmarkList = (landmarkList: LandmarkList, delta: GridDelta): LandmarkList =>
  landmarkList.map(
    (landmark: Landmark) =>
      ({
        x: landmark.x + delta.x,
        y: landmark.y + delta.y,
        z: landmark.z + delta.z,
        visibility: landmark.visibility,
      } as Landmark),
  );

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
  const neck = pose.landmarks[3];
  const ankle = midpointBetween(pose.landmarks[20], pose.landmarks[24]);

  return distanceInXY(neck, ankle);
};

export const heightInWorld = (pose: Pose): number => {
  const neckWorld = pose.worldLandmarks[3];
  const ankleWorld = midpointBetween(pose.worldLandmarks[20], pose.worldLandmarks[24]);

  return distanceInXY(neckWorld, ankleWorld);
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

export const copyLandmark = (normalizedLandmark: NormalizedLandmark): NormalizedLandmark => ({
  x: normalizedLandmark.x,
  y: normalizedLandmark.y,
  z: normalizedLandmark.z,
  visibility: normalizedLandmark.visibility,
});

// TODO: 上の関数と役割が被っているので、どちらかに統一する
export const getAngle = (pose: Pose, startJoint: number, endJoint: number, viewDirection: string) => {
  const start = pose.worldLandmarks[startJoint];
  const end = pose.worldLandmarks[endJoint];
  const x = end.x - start.x;
  const y = end.y - start.y;
  const z = end.z - start.z;
  if (viewDirection === 'front') {
    return (Math.atan2(y, x) * 180) / Math.PI;
  }
  if (viewDirection === 'side') {
    return (Math.atan2(z, y) * 180) / Math.PI;
  }
  if (viewDirection === 'above') {
    return (Math.atan2(Math.sqrt(x * x + z * z), y) * 180) / Math.PI;
  }
  if (viewDirection === 'top') {
    return (Math.atan2(x, -z) * 180) / Math.PI;
  }

  throw new Error(`Unknown view direction: ${viewDirection}`);
};
