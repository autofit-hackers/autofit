import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';

export type Pose = {
  landmarks: NormalizedLandmarkList;
  worldLandmarks: LandmarkList;
  timestamp?: number; // UNIX time(ms単位)
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
    yz: (Math.atan2(z, -y) * 180) / Math.PI, // y軸となす角度
    zx: (Math.atan2(x, -z) * 180) / Math.PI, // z軸となす角度
  };
};

export const getMidpoint = (
  p1: NormalizedLandmark | Landmark,
  p2: NormalizedLandmark | Landmark,
): NormalizedLandmark | Landmark => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
  z: (p1.z + p2.z) / 2,
});

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
