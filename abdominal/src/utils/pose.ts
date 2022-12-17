import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';

export type Pose = {
  landmarks: NormalizedLandmarkList;
  worldLandmarks: LandmarkList;
  timestamp: number; // UNIX time(ms単位)
};

export const rotateWorldLandmarks = (
  worldLandmarks: LandmarkList,
  angle: { roll: number; pitch: number; yaw: number }, // degree
): LandmarkList => {
  const rotatedWorldLandmarks: LandmarkList = [];
  // convert unit of angle from degree to radian
  const roll = (angle.roll * Math.PI) / 180;
  const pitch = (angle.pitch * Math.PI) / 180;
  const yaw = (angle.yaw * Math.PI) / 180;

  for (let i = 0; i < worldLandmarks.length; i += 1) {
    const worldLandmark = worldLandmarks[i];
    // rotate world landmarks with roll
    const rotatedX = worldLandmark.x * Math.cos(roll) - worldLandmark.y * Math.sin(roll);
    const rotatedY = worldLandmark.x * Math.sin(roll) + worldLandmark.y * Math.cos(roll);
    const rotatedZ = worldLandmark.z;

    // rotate world landmarks with pitch
    const rotatedX2 = rotatedX * Math.cos(pitch) + rotatedZ * Math.sin(pitch);
    const rotatedY2 = rotatedY;
    const rotatedZ2 = -rotatedX * Math.sin(pitch) + rotatedZ * Math.cos(pitch);

    // rotate world landmarks with yaw
    const rotatedX3 = rotatedX2;
    const rotatedY3 = rotatedY2 * Math.cos(yaw) - rotatedZ2 * Math.sin(yaw);
    const rotatedZ3 = rotatedY2 * Math.sin(yaw) + rotatedZ2 * Math.cos(yaw);

    // converts unit of world landmarks from m to cm
    rotatedWorldLandmarks.push({
      x: rotatedX3 * 100,
      y: rotatedY3 * 100,
      z: rotatedZ3 * 100,
    });
  }

  return rotatedWorldLandmarks;
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

// worldLandmarksではなくlandmarksを使う
const getLengthAnkleToShoulder = (pose: Pose): { left: number; right: number; mean: number } => {
  const leftShoulder = pose.landmarks[11];
  const leftKnee = pose.landmarks[25];
  const rightShoulder = pose.landmarks[12];
  const rightKnee = pose.landmarks[26];

  const leftLength = getDistance(leftShoulder, leftKnee).y;
  const rightLength = getDistance(rightShoulder, rightKnee).y;
  const mean = leftLength + rightLength / 2;

  return {
    left: leftLength,
    right: rightLength,
    mean,
  };
};

// worldLandmarksではなくlandmarksを使う
const getArmLength = (pose: Pose): { left: number; right: number; mean: number } => {
  const leftShoulder = pose.landmarks[11];
  const leftWrist = pose.landmarks[15];
  const rightShoulder = pose.landmarks[12];
  const rightWrist = pose.landmarks[16];

  const leftArmLength = getDistance(leftShoulder, leftWrist).y;
  const rightArmLength = getDistance(rightShoulder, rightWrist).y;
  const mean = leftArmLength + rightArmLength / 2;

  return {
    left: leftArmLength,
    right: rightArmLength,
    mean,
  };
};

export const getInterestJointsDistance = (pose: Pose, exerciseType: 'squat' | 'bench'): number =>
  exerciseType === 'squat' ? getLengthAnkleToShoulder(pose).mean : getArmLength(pose).mean;

export const getLiftingVelocity = (prevPose: Pose, currentPose: Pose, exerciseType: 'squat' | 'bench'): number => {
  const prevDistance = getInterestJointsDistance(prevPose, exerciseType);
  const currentDistance = getInterestJointsDistance(currentPose, exerciseType);
  const time = (currentPose.timestamp - prevPose.timestamp) / 1000; // 秒単位
  const velocity = Math.abs(currentDistance - prevDistance) / time; // 正の値でcm/s

  return velocity;
};

export const getInterestJointPosition = (currentPose: Pose, exerciseType: 'squat' | 'bench') =>
  getInterestJointsDistance(currentPose, exerciseType);
