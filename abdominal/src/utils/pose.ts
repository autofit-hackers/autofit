import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';

export type Pose = {
  landmarks: NormalizedLandmarkList;
  worldLandmarks: LandmarkList;
  timestamp?: number; // UNIX time(ms単位)
};

export const rotateWorldLandmarks = (pose: Pose, axis: 'x' | 'y' | 'z', angleRadian: number): Pose => {
  const { worldLandmarks } = pose;
  const rotatedWorldLandmarks: LandmarkList = [];

  for (let i = 0; i < worldLandmarks.length; i += 1) {
    const worldLandmark = worldLandmarks[i];

    if (axis === 'x') {
      rotatedWorldLandmarks.push({
        x: worldLandmark.x,
        y: worldLandmark.y * Math.cos(angleRadian) - worldLandmark.z * Math.sin(angleRadian),
        z: worldLandmark.y * Math.sin(angleRadian) + worldLandmark.z * Math.cos(angleRadian),
      });
    }
    if (axis === 'y') {
      rotatedWorldLandmarks.push({
        x: worldLandmark.x * Math.cos(angleRadian) + worldLandmark.z * Math.sin(angleRadian),
        y: worldLandmark.y,
        z: -worldLandmark.x * Math.sin(angleRadian) + worldLandmark.z * Math.cos(angleRadian),
      });
    }
    if (axis === 'z') {
      rotatedWorldLandmarks.push({
        x: worldLandmark.x * Math.cos(angleRadian) - worldLandmark.y * Math.sin(angleRadian),
        y: worldLandmark.x * Math.sin(angleRadian) + worldLandmark.y * Math.cos(angleRadian),
        z: worldLandmark.z,
      });
    }
  }

  return {
    ...pose,
    worldLandmarks: rotatedWorldLandmarks,
  };
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

const getLengthKneeToShoulder = (pose: Pose): { left: number; right: number; mean: number } => {
  const leftShoulder = pose.worldLandmarks[11];
  const leftKnee = pose.worldLandmarks[25];
  const rightShoulder = pose.worldLandmarks[12];
  const rightKnee = pose.worldLandmarks[26];

  const leftLength = getDistance(leftShoulder, leftKnee).z;
  const rightLength = getDistance(rightShoulder, rightKnee).z;
  const mean = leftLength + rightLength / 2;

  return {
    left: leftLength,
    right: rightLength,
    mean,
  };
};

const getArmLength = (pose: Pose): { left: number; right: number; mean: number } => {
  const leftShoulder = pose.worldLandmarks[11];
  const leftWrist = pose.worldLandmarks[15];
  const rightShoulder = pose.worldLandmarks[12];
  const rightWrist = pose.worldLandmarks[16];

  const leftArmLength = getDistance(leftShoulder, leftWrist).z;
  const rightArmLength = getDistance(rightShoulder, rightWrist).z;
  const mean = leftArmLength + rightArmLength / 2;

  return {
    left: leftArmLength,
    right: rightArmLength,
    mean,
  };
};

export const getInterestJointsDistance = (pose: Pose, exerciseType: 'squat' | 'bench'): number =>
  exerciseType === 'squat' ? getLengthKneeToShoulder(pose).mean : getArmLength(pose).mean;
