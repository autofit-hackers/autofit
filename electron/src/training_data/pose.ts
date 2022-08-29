import {
  Landmark,
  LandmarkConnectionArray,
  LandmarkList,
  NormalizedLandmark,
  NormalizedLandmarkList,
} from '@mediapipe/pose';
import { Vector3 } from 'three';

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
    mediapipePose[i] = {
      x: kinectPoses[i].colorX / canvas.width - 0.5,
      y: kinectPoses[i].colorY / canvas.height,
      z: 0,
    };

    // Depthカメラがcolorカメラと比べ，Z軸が6度ずれているので補正
    // woldLandmarksはmmからcm単位に変換する
    if (rotation) {
      mediapipePoseWorld[i] = {
        x: kinectPoses[i].cameraX / 10,
        y: (kinectPoses[i].cameraY * Math.cos(depthToRGB) + kinectPoses[i].cameraZ * Math.sin(depthToRGB)) / 10,
        // a user stands about 1.7m away from the camera (kinect)
        // we translate worldLandmarks to the center of poseGrid (side view) by translating them by -1.7m
        z: (kinectPoses[i].cameraY * Math.sin(-depthToRGB) + kinectPoses[i].cameraZ * Math.cos(depthToRGB)) / 10 - 170,
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
    yz: (Math.atan2(z, y) * 180) / Math.PI, // y軸となす角度
    zx: (Math.atan2(x, -z) * 180) / Math.PI, // z軸となす角度
  };
};

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

  return getDistance(neck, ankle).xy;
};

export const heightInWorld = (pose: Pose): number => {
  const neckWorld = pose.worldLandmarks[3];
  const ankleWorld = midpointBetween(pose.worldLandmarks[20], pose.worldLandmarks[24]);

  return getDistance(neckWorld, ankleWorld).xy;
};

export const copyLandmark = (normalizedLandmark: NormalizedLandmark): NormalizedLandmark => ({
  x: normalizedLandmark.x,
  y: normalizedLandmark.y,
  z: normalizedLandmark.z,
  visibility: normalizedLandmark.visibility,
});

export const landmarkToVector3 = (point: NormalizedLandmark): Vector3 => new Vector3(point.x, -point.y, -point.z);
