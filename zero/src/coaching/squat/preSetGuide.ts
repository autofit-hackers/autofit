import { LandmarkList } from '@mediapipe/pose';
import { getDistance, KJ, getAngle } from '../../training_data/pose';

export type PreSetGuide = {
  nameJP: string;
  label: string;
  shouldPutWarning: boolean;
  checkIfCleared: (landmarks: LandmarkList) => { isCleared: boolean; guideText: string };
};

export const standingPosition: PreSetGuide = {
  nameJP: '立つ位置',
  label: 'スタートポジションに立つ',
  shouldPutWarning: true,
  checkIfCleared: (landmarks: LandmarkList) => {
    const distanceFromStartPosition = landmarks[KJ.SPINE_CHEST].z; // カメラから1.7m前でz=0になる。pose.ts参照
    const thresholds = { lower: 0, upper: 30 };

    const isCleared = distanceFromStartPosition >= thresholds.lower && distanceFromStartPosition <= thresholds.upper;
    if (distanceFromStartPosition < thresholds.lower) {
      return {
        isCleared,
        guideText: 'もうすこし後ろに下がってください',
      };
    }
    if (distanceFromStartPosition > thresholds.upper) {
      return {
        isCleared,
        guideText: 'もうすこし前に出てください',
      };
    }

    return {
      isCleared,
      guideText: '',
    };
  },
};

export const stanceWidth: PreSetGuide = {
  nameJP: '足幅',
  label: '足を肩幅より少し広く開く',
  shouldPutWarning: false,
  checkIfCleared: (landmarks: LandmarkList) => {
    const leftShoulder = landmarks[KJ.SHOULDER_LEFT];
    const rightShoulder = landmarks[KJ.SHOULDER_RIGHT];
    const leftAnkle = landmarks[KJ.ANKLE_LEFT];
    const rightAnkle = landmarks[KJ.ANKLE_RIGHT];

    const shoulderWidth = getDistance(leftShoulder, rightShoulder).xyz;
    const ankleWidth = getDistance(leftAnkle, rightAnkle).xyz;
    const ankleShoulderWidthRatio = ankleWidth / shoulderWidth;

    const thresholds = { lower: 0.9, upper: 1.3 };
    const isCleared = ankleShoulderWidthRatio >= thresholds.lower && ankleShoulderWidthRatio <= thresholds.upper;
    if (ankleShoulderWidthRatio < thresholds.lower) {
      return {
        isCleared,
        guideText: '足幅をもう少し広げてください',
      };
    }
    if (ankleShoulderWidthRatio > thresholds.upper) {
      return {
        isCleared,
        guideText: '足幅をもう少し狭めてください',
      };
    }

    return {
      isCleared,
      guideText: '',
    };
  },
};

export const footAngle: PreSetGuide = {
  nameJP: '足の角度',
  label: 'つま先は約60度開く',
  shouldPutWarning: false,
  checkIfCleared: (landmarks: LandmarkList) => {
    const leftFoot = landmarks[KJ.FOOT_LEFT];
    const leftAnkle = landmarks[KJ.ANKLE_LEFT];
    const rightFoot = landmarks[KJ.FOOT_RIGHT];
    const rightAnkle = landmarks[KJ.ANKLE_RIGHT];

    const leftFootAngle = getAngle(leftAnkle, leftFoot).zx;
    const rightFootAngle = -getAngle(rightAnkle, rightFoot).zx;
    const footAngleSum = leftFootAngle + rightFootAngle;

    const thresholds = { lower: 20, upper: 40 }; // TODO: パラメタ調整
    const isCleared = footAngleSum >= thresholds.lower && footAngleSum <= thresholds.upper;
    if (footAngleSum < thresholds.lower) {
      return {
        isCleared,
        guideText: '足の角度を広げてください',
      };
    }
    if (footAngleSum > thresholds.upper) {
      return {
        isCleared,
        guideText: 'もう少し足を閉じてください',
      };
    }

    return {
      isCleared,
      guideText: '',
    };
  },
};

export const shoulderPacking: PreSetGuide = {
  nameJP: '肩のパッキング',
  label: '姿勢をよくする',
  shouldPutWarning: false,
  // TODO: チョトムズイ
  checkIfCleared: (landmarks: LandmarkList) => {
    const neckToLeftShoulderAngle = getAngle(landmarks[KJ.NECK], landmarks[KJ.SHOULDER_LEFT]).zx;
    const neckToRightShoulderAngle = -getAngle(landmarks[KJ.NECK], landmarks[KJ.SHOULDER_RIGHT]).zx;
    const neckToEachShoulderAngle = neckToLeftShoulderAngle + neckToRightShoulderAngle;

    const thresholds = { lower: 170, upper: 200 };
    const isCleared = neckToEachShoulderAngle >= thresholds.lower && neckToEachShoulderAngle <= thresholds.upper;

    return { isCleared, guideText: isCleared ? '' : '姿勢をよくしてください' };
  },
};
