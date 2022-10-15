import {
  Landmark,
  LandmarkConnectionArray,
  LandmarkList,
  NormalizedLandmark,
  NormalizedLandmarkList,
} from '@mediapipe/pose';
import { Vector3 } from 'three';

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

export const KJ = {
  PELVIS: 0,
  SPINE_NAVEL: 1,
  SPINE_CHEST: 2,
  NECK: 3,
  CLAVICLE_LEFT: 4,
  SHOULDER_LEFT: 5,
  ELBOW_LEFT: 6,
  WRIST_LEFT: 7,
  HAND_LEFT: 8,
  HANDTIP_LEFT: 9,
  THUMB_LEFT: 10,
  CLAVICLE_RIGHT: 11,
  SHOULDER_RIGHT: 12,
  ELBOW_RIGHT: 13,
  WRIST_RIGHT: 14,
  HAND_RIGHT: 15,
  HANDTIP_RIGHT: 16,
  THUMB_RIGHT: 17,
  HIP_LEFT: 18,
  KNEE_LEFT: 19,
  ANKLE_LEFT: 20,
  FOOT_LEFT: 21,
  HIP_RIGHT: 22,
  KNEE_RIGHT: 23,
  ANKLE_RIGHT: 24,
  FOOT_RIGHT: 25,
  HEAD: 26,
  NOSE: 27,
  EYE_LEFT: 28,
  EAR_LEFT: 29,
  EYE_RIGHT: 30,
  EAR_RIGHT: 31,
  COUNT: 32,
} as const; // REF: as constの使い方（https://typescriptbook.jp/reference/values-types-variables/const-assertion）

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
  landmarks: NormalizedLandmarkList;
  worldLandmarks: LandmarkList;
  timestamp: number; // UNIX time(ms単位)
};

export const convertKinectResultsToPose = (
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
  timestamp: number,
): Pose => {
  const landmarks: NormalizedLandmarkList = [];
  const worldLandmarks: LandmarkList = [];
  const depthToRGB = (Math.PI * 6) / 180.0;
  for (let i = 0; i < kinectPoses.length; i += 1) {
    // x軸を反転させることで，鏡像にする
    landmarks[i] = {
      x: 1.5 - kinectPoses[i].colorX / canvas.width,
      y: kinectPoses[i].colorY / canvas.height,
      z: 0,
    };

    // Depthカメラがcolorカメラと比べ，Z軸が6度ずれているので補正。woldLandmarksはmmからcm単位に変換する
    // TODO: 体の向きとz軸が常に一致するように変換する
    if (rotation) {
      worldLandmarks[i] = {
        x: kinectPoses[i].cameraX / 10,
        // y-axis is downward by default, we translate it upward
        // align zero plane with the floor by translating landmarks by 93cm
        y: 93 - (kinectPoses[i].cameraY * Math.cos(depthToRGB) + kinectPoses[i].cameraZ * Math.sin(depthToRGB)) / 10,
        // a user stands about 1.7m away from the camera (kinect)
        // we translate worldLandmarks to the center of poseGrid (side view) by translating them by -1.7m
        z: (kinectPoses[i].cameraY * Math.sin(-depthToRGB) + kinectPoses[i].cameraZ * Math.cos(depthToRGB)) / 10 - 170,
      };
    } else {
      worldLandmarks[i] = { x: kinectPoses[i].cameraX, y: kinectPoses[i].cameraY, z: kinectPoses[i].cameraZ };
    }
  }

  return { landmarks, worldLandmarks, timestamp };
};

export const getDistance = (start: Landmark, end: Landmark) => ({
  x: Math.abs(start.x - end.x),
  y: Math.abs(start.y - end.y),
  z: Math.abs(start.z - end.z),
  xy: Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2),
  yz: Math.sqrt((start.y - end.y) ** 2 + (start.z - end.z) ** 2),
  zx: Math.sqrt((start.z - end.z) ** 2 + (start.x - end.x) ** 2),
  xyz: Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2 + (start.z - end.z) ** 2),
});

export const getAngle = (start: Landmark, end: Landmark) => {
  const x = end.x - start.x;
  const y = end.y - start.y;
  const z = end.z - start.z;

  return {
    xy: (Math.atan2(y, x) * 180) / Math.PI, // x軸となす角度
    // TODO: ｙ軸の正負変更に併せて負に。要動作確認
    yz: (Math.atan2(z, -y) * 180) / Math.PI, // y軸となす角度
    zx: (Math.atan2(x, -z) * 180) / Math.PI, // z軸となす角度
  };
};

export const normalizeAngle = (
  angle: number,
  mode: 'positive-inferior' | 'permit-negative-inferior' | 'positive-obtuse',
): number => {
  if (mode === 'positive-inferior') {
    return angle >= 0 ? angle : angle + 360;
  }
  if (mode === 'positive-obtuse') {
    return angle >= 0 ? angle % 360 : (angle % 360) + 360;
  }
  if (mode === 'permit-negative-inferior') {
    return angle % 180;
  }

  return angle;
};

export const getMidpoint = (
  p1: NormalizedLandmark | Landmark,
  p2: NormalizedLandmark | Landmark,
): NormalizedLandmark | Landmark => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
  z: (p1.z + p2.z) / 2,
});

export const getVector = (start: NormalizedLandmark | Landmark, end: NormalizedLandmark | Landmark) => {
  const x = end.x - start.x;
  const y = end.y - start.y;
  const z = end.z - start.z;

  return { x, y, z };
};

export const getVectorLength = (vector: { x: number; y: number; z: number }) =>
  Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);

export const heightInFrame = (pose: Pose): number => {
  const neck = pose.landmarks[3];
  const ankle = getMidpoint(pose.landmarks[20], pose.landmarks[24]);

  return getDistance(neck, ankle).xy;
};

export const heightInWorld = (pose: Pose): number => {
  const neckWorld = pose.worldLandmarks[3];
  const ankleWorld = getMidpoint(pose.worldLandmarks[20], pose.worldLandmarks[24]);

  return getDistance(neckWorld, ankleWorld).xy;
};

export const copyLandmark = (normalizedLandmark: NormalizedLandmark): NormalizedLandmark => ({
  x: normalizedLandmark.x,
  y: normalizedLandmark.y,
  z: normalizedLandmark.z,
  visibility: normalizedLandmark.visibility,
});

export const landmarkToVector3 = (point: NormalizedLandmark): Vector3 => new Vector3(point.x, point.y, point.z);
