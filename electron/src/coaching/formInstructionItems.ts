import { getAngle, getDistance } from '../training_data/pose';
import { getBottomPose, getTopPose, Rep } from '../training_data/rep';
import { KJ } from '../utils/kinectJoints';
import { CameraAngle } from '../utils/poseGrid';

export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  readonly description: { minus: string; normal: string; plus: string };
  readonly voice: { minus: string; normal: string; plus: string };
  readonly summaryDescription: { minus: string; plus: string };
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly importance?: number;
  readonly poseGridCameraAngle: CameraAngle;
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
  description: {
    minus: '腰を太ももが平行になるまで落としましょう。痛みが起きる場合はバーベルを軽くしてみましょう。',
    normal: 'ちょうどよい深さで腰を落とせています。この調子。',
    plus: '腰を落としすぎているようです。悪いことではありませんが、一般的なスクワットでは、太ももが水平になるところまで腰を落とせば十分です。',
  },
  voice: {
    minus: '腰を太ももが平行になるまで落としましょう。',
    normal: 'ちょうどよい深さで腰を落とせています。この調子。',
    plus: '腰は太ももが床と平行になるところまで落とせば十分です。',
  },
  summaryDescription: {
    minus:
      'しゃがみが浅い傾向にあります。せっかく筋トレをしているのに、しゃがみが浅すぎると負荷が減ってしまってもったいないので、腰を太ももが平行になるまで落としましょう。',
    plus: '腰を落としすぎているようです。悪いことではありませんが、深く腰を落としすぎると膝への負担が大きくなるので、太ももが水平になるところまで腰を落とすと良いでしょう。',
  },
  importance: 0.5,
  poseGridCameraAngle: { theta: 90, phi: 0 },
  evaluate: (rep: Rep) => {
    const pose = getBottomPose(rep);
    const threshold = { upper: 90, middle: 80, lower: 60 };
    if (pose === undefined) {
      return 0.0;
    }
    // errorはbottomの太ももの水平面との角度を計算。値は正で、約90度
    // TODO: 右足も考慮
    const error = -getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).yz;

    return normalizeError(threshold, error);
  },
};

const kneeInAndOut: FormInstructionItem = {
  id: 1,
  name: 'Knee in and out',
  label: 'ひざの内旋・外旋',
  description: {
    minus: '膝が内側に入りすぎています。膝を痛める可能性があるので、足と太ももが平行になるようにしましょう。',
    normal: '足の向きと太ももの向きが一致していて、とても良いです。',
    plus: '膝を外側に出そうとしすぎているようです。もう少しだけ膝の力を抜いてください。',
  },
  voice: {
    minus: '膝が内側に入りすぎています。',
    normal: '足の向きと太ももの向きが一致していて、とても良いです。',
    plus: '膝を外側に出そうとしすぎているようです。',
  },
  summaryDescription: {
    minus:
      '膝が内側に入りすぎています。膝を痛める可能性があるので、足と太ももが平行になるように意識しながらしゃがみしましょう。どうしても力が入らない場合はスタンス幅を狭めてみるといいかもしれません。',
    plus: '膝を外側に出そうとしすぎています。膝を痛める可能性があるので、足と太ももが平行になるように意識しながらしゃがみしましょう。',
  },
  importance: 0.7,
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluate: (rep: Rep) => {
    const bottomWorldLandmarks = getBottomPose(rep)?.worldLandmarks;
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const threshold = { upper: 15, middle: 0, lower: -15 };
    if (bottomWorldLandmarks === undefined || topWorldLandmarks === undefined) {
      return 0.0;
    }
    // errorはbottomの膝の開き具合とつま先の開き具合の差。値はニーインの場合負、約0度
    const openingOfKnee =
      getAngle(bottomWorldLandmarks[KJ.HIP_LEFT], bottomWorldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(bottomWorldLandmarks[KJ.HIP_RIGHT], bottomWorldLandmarks[KJ.KNEE_RIGHT]).zx;
    const openingOfToe =
      getAngle(topWorldLandmarks[KJ.ANKLE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(topWorldLandmarks[KJ.ANKLE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).zx;
    const error = openingOfKnee - openingOfToe;

    return normalizeError(threshold, error);
  },
};

// 足のスタンス幅
const stanceWidth: FormInstructionItem = {
  id: 2,
  name: 'Stance width',
  label: '足のスタンス幅',
  description: {
    minus: '足幅が狭すぎます。腰を落としにくくなってしまうので、足は肩幅程度に開きましょう。',
    normal: '足のスタンスはバッチリです。',
    plus: '足幅が広すぎます。肩幅程度に狭めてみましょう。',
  },
  voice: {
    minus: '足幅が狭すぎます。足は肩幅程度に開きましょう。',
    normal: '足のスタンスはバッチリです。',
    plus: '足幅が広すぎます。肩幅程度に狭めてみましょう。',
  },
  summaryDescription: {
    minus: '足幅が狭すぎます。腰を落としにくくなってしまうので、足は肩幅程度に開きましょう。',
    plus: '足幅が広すぎます。しゃがんだ時に膝に負担がかかる恐れがあるので、肩幅程度に狭めましょう。',
  },
  importance: 0.7,
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluate: (rep: Rep) => {
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const threshold = { upper: 2, middle: 1.4, lower: 1 };
    if (topWorldLandmarks === undefined) {
      return 0.0;
    }
    const footWidth = getDistance(topWorldLandmarks[KJ.FOOT_LEFT], topWorldLandmarks[KJ.FOOT_RIGHT]).x;
    const shoulderWidth = getDistance(topWorldLandmarks[KJ.SHOULDER_LEFT], topWorldLandmarks[KJ.SHOULDER_RIGHT]).x;
    const error = footWidth / shoulderWidth;

    return normalizeError(threshold, error);
  },
};

const kneeFrontAndBack: FormInstructionItem = {
  id: 3,
  name: 'Knee front and back',
  label: '膝の前後位置',
  description: {
    minus: 'お尻を引きすぎているようです。つま先の上までは膝を出しても大丈夫です。',
    normal: 'ちょうど良い膝の曲げ方です。その調子で重心を足の真上で保ちましょう。',
    plus: '膝が前に出過ぎています。膝を痛める恐れがあるので、つま先を膝が声すぎないように注意しましょう。',
  },
  voice: {
    minus: 'お尻を引きすぎです。',
    normal: 'ちょうど良い膝の曲げ方です。',
    plus: '膝が前に出過ぎています。',
  },
  summaryDescription: {
    minus:
      'お尻を後ろに引きすぎているようです。膝がつま先より後ろにくると後ろ重心になり、バランスが悪くなります。つま先の上までは膝を出しても大丈夫なので、無理のない姿勢でスクワットしましょう。',
    plus: '膝が前に出過ぎています。膝を痛める恐れがあるので、つま先を膝が越えすぎないように注意しましょう。お尻を引きながら腰を落とすイメージです。',
  },
  poseGridCameraAngle: { theta: 90, phi: 0 },
  evaluate: (rep: Rep) => {
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const bottomWorldLandmarks = getBottomPose(rep)?.worldLandmarks;
    const threshold = { upper: 30, middle: 10, lower: -10 };
    if (bottomWorldLandmarks === undefined || topWorldLandmarks === undefined) {
      return 0.0;
    }
    // TODO: 左足も考慮する
    const error = getDistance(bottomWorldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z;

    return normalizeError(threshold, error);
  },
};

const squatVelocity: FormInstructionItem = {
  id: 4,
  name: 'Speed',
  label: 'フォーム速度',
  description: {
    minus: 'スクワットのペースが速いです。もう少しゆっくりの速度で効かせましょう。',
    normal: 'いい速さでスクワットできています。',
    plus: '少しペースが遅いです。効かせることも重要ですが、効率よく筋力を発揮するため、テンポ良く立ち上がれるようにしましょう。',
  },
  voice: {
    minus: '少し速いです。もう少しゆっくり。',
    normal: 'いい速さです。',
    plus: '少しペースが遅いです。もう少しテンポ良く。',
  },
  summaryDescription: {
    minus:
      'スクワットのペースが速いです。ペースが速すぎると反動を使ってしまう上、関節に負担がかかります。もう少しゆっくりの速度で筋肉に効かせるイメージを持ちましょう。目安は、2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるくらいです。',
    plus: '少しペースが遅いです。効かせることも重要ですが、遅すぎる必要はありません。効率よく筋力を発揮するため、2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるようにしましょう。',
  },
  poseGridCameraAngle: { theta: 90, phi: 270 },
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
