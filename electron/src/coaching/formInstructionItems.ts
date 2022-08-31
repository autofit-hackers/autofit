import { landmarkToVector3, getAngle, getDistance, Pose } from '../training_data/pose';
import { getBottomPose, getTopPose, Rep } from '../training_data/rep';
import KJ from '../utils/kinectJoints';
import type { CameraAngle, GuidelineSymbols } from '../utils/poseGrid';

type Description = { first: string; second: string };

// TODO: クラスにしたほうが扱いやすいかも
export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  readonly shortDescription: { minus: Description; normal: Description; plus: Description };
  readonly longDescription: { minus: string; plus: string };
  readonly voice: { minus: string; normal: string; plus: string };
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly importance?: number;
  readonly poseGridCameraAngle: CameraAngle;
  // TODO: 以下の関数は共通する処理が多いのでうまくまとめる
  readonly evaluateFrom: (rep: Rep) => number;
  readonly getGuidelineSymbols?: (rep: Rep, currentPose?: Pose) => GuidelineSymbols;
  readonly getCoordinateErrorFromIdeal?: (rep: Rep) => number;
};

export type FormEvaluationResult = {
  name: string;
  descriptionsForEachRep: string[];
  shortSummary: string;
  longSummary: string;
  overallComment: string;
  eachRepErrorScores: number[];
  eachRepCoordinateErrors: number[];
  score: number;
  bestRepIndex: number;
  worstRepIndex: number;
};

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

const calculateError = (thresholds: { upper: number; middle: number; lower: number }, value: number): number => {
  if (value < thresholds.middle) {
    return (value - thresholds.middle) / (thresholds.middle - thresholds.lower);
  }

  return (value - thresholds.middle) / (thresholds.upper - thresholds.middle);
};

const squatDepth: FormInstructionItem = {
  id: 0,
  name: 'Squat depth',
  label: 'しゃがむ深さ',
  shortDescription: {
    minus: { first: '', second: 'cmほどしゃがみが浅いです。太ももが水平になるまで腰を落としてください' },
    normal: { first: 'ちょうどよい深さで腰を落とせています。この調子。', second: '' },
    plus: { first: '', second: 'cmほどしゃがみが深いです。太ももが水平になる角度で腰を止めてください。' },
  },
  longDescription: {
    minus:
      'しゃがみが浅い傾向にあります。せっかく筋トレをしているのに、しゃがみが浅すぎると負荷が減ってしまってもったいないので、腰を太ももが平行になるまで落としましょう。',
    plus: '腰を落としすぎているようです。悪いことではありませんが、深く腰を落としすぎると膝への負担が大きくなるので、太ももが水平になるところまで腰を落とすと良いでしょう。',
  },
  voice: {
    minus: '腰を太ももが平行になるまで落としましょう。',
    normal: 'ちょうどよい深さで腰を落とせています。この調子。',
    plus: '腰は太ももが床と平行になるところまで落とせば十分です。',
  },
  importance: 0.5,
  poseGridCameraAngle: { theta: 90, phi: 0 },
  // しゃがみが深いほど角度は大きい
  evaluateFrom: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    // TODO: 浅いほうを厳しく、深いほうを甘くする
    const thresholds = { upper: 90, middle: 80, lower: 60 };
    if (bottomPose === undefined) {
      return 0.0;
    }
    // bottomの太ももとy軸との角度を計算。値は正。
    const leftThighAngleFromSide = -getAngle(
      bottomPose.worldLandmarks[KJ.HIP_LEFT],
      bottomPose.worldLandmarks[KJ.KNEE_LEFT],
    ).yz;
    const rightThighAngleFromSide = -getAngle(
      bottomPose.worldLandmarks[KJ.HIP_RIGHT],
      bottomPose.worldLandmarks[KJ.KNEE_RIGHT],
    ).yz;
    const meanThighAngleFromSide = (leftThighAngleFromSide + rightThighAngleFromSide) / 2;

    return calculateError(thresholds, meanThighAngleFromSide);
  },
  getGuidelineSymbols: (rep: Rep): GuidelineSymbols => {
    const thresholds = { upper: 90, middle: 80, lower: 60 };
    const guidelineSymbols: GuidelineSymbols = {};
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      return guidelineSymbols;
    }

    const kneeY = (bottomPose.worldLandmarks[KJ.KNEE_RIGHT].y + bottomPose.worldLandmarks[KJ.KNEE_LEFT].y) / 2;
    const averageThighLengthFromSide =
      (getDistance(bottomPose.worldLandmarks[KJ.HIP_LEFT], bottomPose.worldLandmarks[KJ.KNEE_LEFT]).yz +
        getDistance(bottomPose.worldLandmarks[KJ.HIP_RIGHT], bottomPose.worldLandmarks[KJ.KNEE_RIGHT]).yz) /
      2;
    const idealHipY = kneeY + averageThighLengthFromSide * Math.sin(((thresholds.middle - 90) * Math.PI) / 180);
    const idealLeftHip = {
      x: bottomPose.worldLandmarks[KJ.HIP_LEFT].x,
      y: idealHipY,
      z: bottomPose.worldLandmarks[KJ.HIP_LEFT].z,
    };
    const idealRightHip = {
      x: bottomPose.worldLandmarks[KJ.HIP_RIGHT].x,
      y: idealHipY,
      z: bottomPose.worldLandmarks[KJ.HIP_RIGHT].z,
    };

    guidelineSymbols.lines = [{ from: landmarkToVector3(idealRightHip), to: landmarkToVector3(idealLeftHip) }];

    return guidelineSymbols;
  },
  getCoordinateErrorFromIdeal: (rep: Rep): number => {
    const thresholds = { upper: 90, middle: 80, lower: 60 };
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      return 0;
    }

    const kneeY = (bottomPose.worldLandmarks[KJ.KNEE_RIGHT].y + bottomPose.worldLandmarks[KJ.KNEE_LEFT].y) / 2;
    const averageThighLengthFromSide =
      (getDistance(bottomPose.worldLandmarks[KJ.HIP_LEFT], bottomPose.worldLandmarks[KJ.KNEE_LEFT]).yz +
        getDistance(bottomPose.worldLandmarks[KJ.HIP_RIGHT], bottomPose.worldLandmarks[KJ.KNEE_RIGHT]).yz) /
      2;
    const idealHipY = kneeY + averageThighLengthFromSide * Math.sin(((thresholds.middle - 90) * Math.PI) / 180);
    const realHipY = (bottomPose.worldLandmarks[KJ.HIP_LEFT].y + bottomPose.worldLandmarks[KJ.HIP_RIGHT].y) / 2;
    const errorInt = Math.round(realHipY - idealHipY);

    return errorInt;
  },
};

const kneeInAndOut: FormInstructionItem = {
  id: 1,
  name: 'Knee in and out',
  label: 'ひざの開き',
  shortDescription: {
    minus: { first: '膝を', second: 'cmほど外側に押し出してください。' },
    normal: {
      first: '足の向きと太ももの向きが一致していて、とても良いです。',
      second: '',
    },
    plus: { first: '膝が', second: 'cmほど外に出すぎてしまっています。' },
  },
  longDescription: {
    minus:
      '膝が内側に入りすぎています。膝を痛める可能性があるので、足と太ももが平行になるように意識しながらしゃがみしましょう。どうしても力が入らない場合はスタンス幅を狭めてみるといいかもしれません。',
    plus: '膝を外側に出そうとしすぎています。膝を痛める可能性があるので、足と太ももが平行になるように意識しながらしゃがみしましょう。',
  },
  voice: {
    minus: '膝が内側に入りすぎています。',
    normal: '足の向きと太ももの向きが一致していて、とても良いです。',
    plus: '膝を外側に出そうとしすぎているようです。',
  },
  importance: 0.7,
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluateFrom: (rep: Rep) => {
    const bottomWorldLandmarks = getBottomPose(rep)?.worldLandmarks;
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const thresholds = { upper: 30, middle: 10, lower: -5 };
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

    return calculateError(thresholds, error);
  },
  getGuidelineSymbols: (rep: Rep): GuidelineSymbols => {
    // const thresholds = { upper: 15, middle: 0, lower: -15 };
    const guidelineSymbols: GuidelineSymbols = {};

    const bottomWorldLandmarks = getBottomPose(rep)?.worldLandmarks;
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    if (bottomWorldLandmarks === undefined || topWorldLandmarks === undefined) {
      return guidelineSymbols;
    }

    // TODO: implement guideline symbols calculation
    // const leftHip = bottomWorldLandmarks[KJ.HIP_LEFT];
    // const leftThighLength = getDistance(leftHip, bottomWorldLandmarks[KJ.KNEE_LEFT]).xyz;
    // const leftFootAngle = getAngle(leftHip, bottomWorldLandmarks[KJ.KNEE_LEFT]).zx;
    // const idealKnee =

    // const rightHip = bottomWorldLandmarks[KJ.HIP_RIGHT];
    // const rightThighLength = getDistance(rightHip, bottomWorldLandmarks[KJ.KNEE_RIGHT]).xyz;
    // const rightFootAngle = getAngle(rightHip, bottomWorldLandmarks[KJ.KNEE_RIGHT]).zx;

    // guidelineSymbols.lines = [
    //   { from: landmarkToVector3(bottomPose.worldLandmarks[KJ.KNEE_LEFT]), to: landmarkToVector3(idealLeftHip) },
    //   { from: landmarkToVector3(bottomPose.worldLandmarks[KJ.KNEE_RIGHT]), to: landmarkToVector3(idealRightHip) },
    // ];

    return guidelineSymbols;
  },
};

// 足の幅
const stanceWidth: FormInstructionItem = {
  id: 2,
  name: 'Stance width',
  label: '足の幅',
  shortDescription: {
    minus: { first: '足の幅を', second: 'cmほど広くしてください。' },
    normal: { first: '足の幅はバッチリです。', second: '' },
    plus: { first: '足の幅を', second: 'cmほど狭くしてください' },
  },
  longDescription: {
    minus: '足の幅が狭すぎます。腰を落としにくくなってしまうので、足は肩幅より少し広い程度に開きましょう。',
    plus: '足の幅が広すぎます。しゃがんだ時に膝に負担がかかる恐れがあるので、肩幅より少し広い程度に狭めましょう。',
  },
  voice: {
    minus: '足の幅が狭すぎます。足は肩幅より少し広い程度に開きましょう。',
    normal: '足の幅はバッチリです。',
    plus: '足の幅が広すぎます。肩幅より少し広い程度に狭めてみましょう。',
  },
  importance: 0.7,
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluateFrom: (rep: Rep) => {
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const thresholds = { upper: 2, middle: 1.4, lower: 1 };
    if (topWorldLandmarks === undefined) {
      return 0.0;
    }
    const footWidth = getDistance(topWorldLandmarks[KJ.FOOT_LEFT], topWorldLandmarks[KJ.FOOT_RIGHT]).x;
    const shoulderWidth = getDistance(topWorldLandmarks[KJ.SHOULDER_LEFT], topWorldLandmarks[KJ.SHOULDER_RIGHT]).x;
    const error = footWidth / shoulderWidth;

    return calculateError(thresholds, error);
  },
};

const kneeFrontAndBack: FormInstructionItem = {
  id: 3,
  name: 'Knee front and back',
  label: '膝の前後位置',
  shortDescription: {
    minus: { first: '膝の位置を', second: 'cmほど前に出してください。' },
    normal: { first: '膝の前後位置はバッチリです。', second: '' },
    plus: { first: '膝を', second: 'cmほど後ろに引いてください' },
  },
  longDescription: {
    minus:
      'お尻を後ろに引きすぎているようです。膝がつま先より後ろにくると後ろ重心になり、バランスが悪くなります。つま先の上までは膝を出しても大丈夫なので、無理のない姿勢でスクワットしましょう。',
    plus: '膝が前に出過ぎています。膝を痛める恐れがあるので、つま先を膝が越えすぎないように注意しましょう。お尻を引きながら腰を落とすイメージです。',
  },
  voice: {
    minus: 'お尻を引きすぎです。',
    normal: 'ちょうど良い膝の曲げ方です。',
    plus: '膝が前に出過ぎています。',
  },
  poseGridCameraAngle: { theta: 90, phi: 0 },
  evaluateFrom: (rep: Rep) => {
    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const bottomWorldLandmarks = getBottomPose(rep)?.worldLandmarks;
    const thresholds = { upper: 15, middle: 1, lower: -1 };
    if (bottomWorldLandmarks === undefined || topWorldLandmarks === undefined) {
      return 0.0;
    }

    const kneeFootDistanceZ =
      (getDistance(bottomWorldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z +
        getDistance(bottomWorldLandmarks[KJ.KNEE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).z) /
      2;

    return calculateError(thresholds, kneeFootDistanceZ);
  },
};

const squatVelocity: FormInstructionItem = {
  id: 4,
  name: 'Speed',
  label: '速度',
  shortDescription: {
    minus: {
      first: '１レップに約',
      second: '秒かかっています。2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がってください。',
    },
    normal: { first: '速度はバッチリです。', second: '' },
    plus: {
      first: '１レップに約',
      second: '秒かかっています。2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がってください。',
    },
  },
  longDescription: {
    minus:
      'スクワットのペースが速いです。ペースが速すぎると反動を使ってしまう上、関節に負担がかかります。もう少しゆっくりの速度で筋肉に効かせるイメージを持ちましょう。目安は、2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるくらいです。',
    plus: '少しペースが遅いです。効かせることも重要ですが、遅すぎる必要はありません。効率よく筋力を発揮するため、2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるようにしましょう。',
  },
  voice: {
    minus: '少し速いです。もう少しゆっくり。',
    normal: 'いい速さです。',
    plus: '少しペースが遅いです。もう少しテンポ良く。',
  },
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluateFrom: (rep: Rep) => {
    // TODO: fpsを取得する必要がある。一旦25でハードコードしている。
    // TODO: Topの姿勢で停止することがあるので、durationを取得する範囲を再考する必要あり。
    const fps = 25;
    // const threshold = { upper: 5.2, middle: 3.8, lower: 3.3 };
    const thresholds = { upper: 3.0, middle: 2.2, lower: 1.6 };
    if (
      rep.keyframesIndex === undefined ||
      rep.keyframesIndex.ascendingMiddle === undefined ||
      rep.keyframesIndex.descendingMiddle === undefined
    ) {
      throw new Error('keyframesIndex is undefined');
    }
    const repDuration = (rep.keyframesIndex.ascendingMiddle - rep.keyframesIndex.descendingMiddle) / fps;

    return calculateError(thresholds, repDuration);
  },
};

// 指導項目を追加したらここにもかく
export const formInstructionItemsQWS = [squatDepth, kneeInAndOut, stanceWidth, kneeFrontAndBack, squatVelocity];
export const formInstructionItemsEmpty = [];
