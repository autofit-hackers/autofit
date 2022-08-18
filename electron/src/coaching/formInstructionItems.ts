import { CameraPosition } from '../utils/poseGrid';
import { distanceInX, distanceInZ, getAngle } from '../training_data/pose';
import { getBottomPose, getTopPose, Rep } from '../training_data/rep';
import { KJ } from '../utils/kinectJoints';

export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  readonly descriptionForNegativeError: string;
  readonly descriptionForNearlyZeroError: string;
  readonly descriptionForPositiveError: string;
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly importance?: number;
  readonly gridCameraPosition: CameraPosition;
  readonly evaluate: (rep: Rep) => number;
  readonly showGuideline?: (rep: Rep) => void;
};

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

const normalizeError = (threshold: { upper: number; middle: number; lower: number }, error: number): number => {
  if (error < threshold.middle) {
    return (error - threshold.middle) / (threshold.middle - threshold.lower);
  }

  return (error - threshold.middle) / (threshold.upper - threshold.middle);
};

const squatDepth: FormInstructionItem = {
  id: 0,
  name: 'Squat depth',
  label: 'しゃがむ深さ',
  descriptionForNegativeError:
    '腰を太ももが平行になるまで落としましょう。痛みが起きる場合はバーベルを軽くしてみましょう。',
  descriptionForNearlyZeroError: 'ちょうどよい深さで腰を落とせています。この調子。',
  descriptionForPositiveError:
    '腰を落としすぎているようです。悪いことではありませんが、一般的なスクワットでは、太ももが水平になるところまで腰を落とせば十分です。',
  importance: 0.5,
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
  evaluate: (rep: Rep) => {
    const pose = getBottomPose(rep);
    const threshold = { upper: 90, middle: 80, lower: 60 };
    if (pose === undefined) {
      return 0.0;
    }
    // errorはbottomの太ももの水平面との角度を計算。値は正で、約90度
    const error = -getAngle(pose, KJ.HIP_RIGHT, KJ.KNEE_RIGHT, 'side');

    return normalizeError(threshold, error);
  },
};

const kneeInAndOut: FormInstructionItem = {
  id: 1,
  name: 'Knee out',
  label: 'ひざの内旋・外旋',
  descriptionForNegativeError: '膝が内側に入らないように注意しましょう。',
  descriptionForNearlyZeroError: 'ちょうどいい膝の開き方ですね。',
  descriptionForPositiveError: '膝を外側に出そうとしすぎているようです。もう少しだけ膝の力を抜いてください。',
  importance: 0.7,
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
  evaluate: (rep: Rep) => {
    const pose = getBottomPose(rep);
    const threshold = { upper: 15, middle: 0, lower: -15 };
    if (pose === undefined) {
      return 0.0;
    }
    // errorはbottomの膝の開き具合とつま先の開き具合の差。値はニーインの場合負、約0度
    const openingOfKnee =
      getAngle(pose, KJ.HIP_LEFT, KJ.KNEE_LEFT, 'top') - getAngle(pose, KJ.HIP_RIGHT, KJ.KNEE_RIGHT, 'top');
    const openingOfToe =
      getAngle(pose, KJ.ANKLE_LEFT, KJ.FOOT_LEFT, 'top') - getAngle(pose, KJ.ANKLE_RIGHT, KJ.FOOT_RIGHT, 'top');
    const error = openingOfKnee - openingOfToe;

    return normalizeError(threshold, error);
  },
};

// 足のスタンス幅
const stanceWidth: FormInstructionItem = {
  id: 2,
  name: 'Stance width',
  label: '足のスタンス幅',
  descriptionForNegativeError: '足がスタンス幅を満たしていないようです。',
  descriptionForNearlyZeroError: 'ちょうどいいスタンス幅ですね。',
  descriptionForPositiveError: '足幅が広すぎるようです。',
  importance: 0.7,
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
  evaluate: (rep: Rep) => {
    const pose = getTopPose(rep);
    const threshold = { upper: 2, middle: 1.4, lower: 1 };
    if (pose === undefined) {
      return 0.0;
    }
    const footWidth = distanceInX(pose.worldLandmarks[KJ.FOOT_LEFT], pose.worldLandmarks[KJ.FOOT_RIGHT]);
    const shoulderWidth = distanceInX(pose.worldLandmarks[KJ.SHOULDER_LEFT], pose.worldLandmarks[KJ.SHOULDER_RIGHT]);
    const error = footWidth / shoulderWidth;

    return normalizeError(threshold, error);
  },
};

const kneeFrontAndBack: FormInstructionItem = {
  id: 3,
  name: 'Knee position',
  label: '膝の前後位置',
  descriptionForNegativeError: '膝が前に出すぎています。関節を痛める危険性があるため、気を付けましょう',
  descriptionForNearlyZeroError: 'ひざの前後の位置が適切です。',
  descriptionForPositiveError: '膝をもう少し前に出しましょう。',
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
  evaluate: (rep: Rep) => {
    const pose = getBottomPose(rep);
    const threshold = { upper: 30, middle: 10, lower: -10 };
    if (pose === undefined) {
      return 0.0;
    }

    // TODO: 左足も考慮する
    const error = distanceInZ(pose.worldLandmarks[KJ.KNEE_RIGHT], pose.worldLandmarks[KJ.FOOT_RIGHT]);

    return normalizeError(threshold, error);
  },
};

const squatVelocity: FormInstructionItem = {
  id: 4,
  name: 'Knee position',
  label: '膝の前後位置',
  descriptionForNegativeError: 'もう少し早くスクワットしましょう。',
  descriptionForNearlyZeroError: 'ちょうどいいスピードです。',
  descriptionForPositiveError: '動きが速いです。もう少しゆっくりにしましょう。',
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
  evaluate: (rep: Rep) => {
    // TODO: fpsを取得する必要がある。一旦25でハードコードしている。
    const fps = 25;
    const threshold = { upper: 5.2, middle: 3.8, lower: 3.3 };
    const error = rep.form.length / fps;

    return normalizeError(threshold, error);
  },
};

// 指導項目を追加したらここにもかく
export const formInstructionItemsQWS = [squatDepth, kneeInAndOut, stanceWidth, kneeFrontAndBack, squatVelocity];
export const formInstructionItemsEmpty = [];
