import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';
import { Exercise } from './exercise';

export type Pose = {
  landmarks: NormalizedLandmarkList;
  worldLandmarks: LandmarkList;
  timestamp: number; // UNIX time(ms単位)
};

export const MJ = {
  // mediapipe joint name list
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

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

export const getAngleOfLine = (start: Landmark, end: Landmark) => {
  // 直線の方向ベクトルを計算する
  const direction = {
    x: end.x - start.x,
    y: end.y - start.y,
    z: end.z - start.z,
  };

  // x平面との角度を計算する
  const X = Math.atan2(direction.y, direction.z);

  // y平面との角度を計算する
  const Y = Math.atan2(direction.x, direction.z);

  // z平面との角度を計算する
  const Z = Math.atan2(direction.y, direction.x);

  // 角度を度数法に変換して返す
  return {
    x: (X * 180) / Math.PI,
    y: (Y * 180) / Math.PI,
    z: (Z * 180) / Math.PI,
  };
};

const getAngleOfThreePoints = (p1: Landmark, p2: Landmark, p3: Landmark) => {
  const a = Math.sqrt((p2.x - p3.x) ** 2 + (p2.y - p3.y) ** 2 + (p2.z - p3.z) ** 2);
  const b = Math.sqrt((p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2 + (p1.z - p3.z) ** 2);
  const c = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);

  // return angle as degrees between 0 and 180
  return (Math.acos((a ** 2 + b ** 2 - c ** 2) / (2 * a * b)) * 180) / Math.PI;
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

export const getJointsDistanceForRepCount = (pose: Pose, exercise: Exercise): number => {
  if (exercise === 'squat' || exercise === 'dead_lift') return getLengthAnkleToShoulder(pose).mean;
  if (exercise === 'bench_press' || exercise === 'shoulder_press') return getArmLength(pose).mean;

  return 0;
};

export const getLiftingVelocity = (prevPose: Pose, currentPose: Pose, exercise: Exercise): number => {
  const prevDistance = getJointsDistanceForRepCount(prevPose, exercise);
  const currentDistance = getJointsDistanceForRepCount(currentPose, exercise);
  const time = (currentPose.timestamp - prevPose.timestamp) / 1000; // 秒単位
  const velocity = Math.abs(currentDistance - prevDistance) / time; // 正の値でcm/s

  return velocity;
};

export const identifyExercise = (pose: Pose): Exercise | undefined => {
  const { worldLandmarks } = pose;
  const shoulderCenter = getMidpoint(worldLandmarks[11], worldLandmarks[12]);
  const hipCenter = getMidpoint(worldLandmarks[23], worldLandmarks[24]);
  const wristCenter = getMidpoint(worldLandmarks[15], worldLandmarks[16]);
  const kneeCenter = getMidpoint(worldLandmarks[25], worldLandmarks[26]);
  const upperBodyAngle = getAngleOfLine(hipCenter, shoulderCenter).z;
  const hipJointAngle = getAngleOfThreePoints(shoulderCenter, hipCenter, kneeCenter);

  // WARN: ハードコードもりもり
  if (upperBodyAngle < 50 || upperBodyAngle > 150) return 'bench_press';
  if (wristCenter.y < hipCenter.y + 5) return 'dead_lift';
  if (wristCenter.y > worldLandmarks[MJ.NOSE].y + 3) return 'shoulder_press';
  if (Math.abs(hipJointAngle) > 10) return 'squat';

  return undefined;
};

export const getMostFrequentExercise = (exercises: Exercise[]): Exercise => {
  const exerciseCount = exercises.reduce((acc, exercise) => {
    if (acc[exercise] !== null) acc[exercise] = 0;
    acc[exercise] += 1;

    return acc;
  }, {} as { [key in Exercise]: number });

  const sortedExerciseCount = Object.entries(exerciseCount).sort((a, b) => b[1] - a[1]);

  return sortedExerciseCount[0][0] as Exercise;
};
