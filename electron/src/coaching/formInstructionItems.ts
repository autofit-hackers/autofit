import { getBottomPose, getLastPose, getTopPose, Rep } from '../training_data/rep';
import { getAngle, getCenter, getDistance, heightInWorld, KJ, landmarkToVector3, Pose } from '../training_data/pose';
import type { CameraAngle, GuidelineSymbols } from '../utils/poseGrid';
import { FrameEvaluateParams } from './FormInstructionDebug';
import { getOpeningOfKnee, getOpeningOfToe, getThighAngleFromSide } from './squatAnalysisUtils';

type Description = { beforeNumber: string; afterNumber: string };

// TODO: クラスにしたほうが扱いやすいかも
export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  readonly shortDescription: { negative: Description; normal: Description; positive: Description };
  readonly longDescription: { negative: string; positive: string };
  readonly voice: { negative: string; normal: string; positive: string };
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly importance?: number;
  readonly poseGridCameraAngle: CameraAngle;
  // TODO: 以下２つはまとめてもいいかも
  readonly evaluateForm: (rep: Rep) => number;
  readonly calculateRealtimeValue: (evaluatedPose: Pose) => number;
  readonly calculateRealtimeThreshold: (criteriaPose: Pose) => { upper: number; middle: number; lower: number };
  readonly getGuidelineSymbols?: (rep: Rep, currentPose?: Pose) => GuidelineSymbols;
  readonly getCoordinateErrorFromIdeal: (rep: Rep) => number;
};

// TODO: けっこうごちゃごちゃしてきました。整理しましょう。
export type FormEvaluationResult = {
  name: string;
  descriptionsForEachRep: string[];
  isGood: boolean;
  shortSummary: string;
  longSummary: string;
  overallComment: string;
  eachRepErrorScores: number[];
  eachRepCoordinateErrors: number[];
  score: number;
  bestRepIndex: number;
  worstRepIndex: number;
  evaluatedValuesPerFrame: FrameEvaluateParams;
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
    negative: {
      beforeNumber: '',
      afterNumber: 'cmほどしゃがみが浅いです。太ももが水平になるまで腰を落としてください',
    },
    normal: { beforeNumber: 'ちょうどよい深さで腰を落とせています。この調子。', afterNumber: '' },
    positive: {
      beforeNumber: '',
      afterNumber: 'cmほどしゃがみが深いです。太ももが水平になる角度で腰を止めてください。',
    },
  },
  longDescription: {
    negative:
      'しゃがみが浅い傾向にあります。せっかく筋トレをしているのに、しゃがみが浅すぎると負荷が減ってしまってもったいないので、腰を太ももが平行になるまで落としましょう。',
    positive:
      '腰を落としすぎているようです。悪いことではありませんが、深く腰を落としすぎると膝への負担が大きくなるので、太ももが水平になるところまで腰を落とすと良いでしょう。',
  },
  voice: {
    negative: '腰を太ももが平行になるまで落としましょう。',
    normal: 'ちょうどよい深さで腰を落とせています。この調子。',
    positive: '腰は太ももが床と平行になるところまで落とせば十分です。',
  },
  importance: 0.5,
  poseGridCameraAngle: { theta: 90, phi: 0 },
  // しゃがみが深いほど角度は大きい
  evaluateForm: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    // TODO: 浅いほうを厳しく、深いほうを甘くする
    const thresholds = { upper: 100, middle: 80, lower: 60 };
    if (bottomPose === undefined) {
      return 0.0;
    }
    const meanThighAngleFromSide = getThighAngleFromSide(bottomPose);

    return calculateError(thresholds, meanThighAngleFromSide);
  },
  calculateRealtimeValue: (evaluatedPose) => getThighAngleFromSide(evaluatedPose),
  calculateRealtimeThreshold: () => ({ upper: 90, middle: 80, lower: 60 }),
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

    guidelineSymbols.lines = [
      { from: landmarkToVector3(idealRightHip), to: landmarkToVector3(idealLeftHip), showEndPoints: true },
    ];

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
    negative: {
      beforeNumber: '膝が適切な角度より',
      afterNumber: '度ほど内側に入っています。つま先とひざの向きを揃えるようにしてください。',
    },
    normal: {
      beforeNumber: '足の向きと太ももの向きが一致していて、とても良いです。',
      afterNumber: '',
    },
    positive: {
      beforeNumber: '膝が適切な角度より',
      afterNumber: '度ほど大きく開いています。つま先とひざの向きを揃えるようにしてください。',
    },
  },
  longDescription: {
    negative:
      '膝が内側に入りすぎています。膝を痛める可能性があるので、足と太ももが平行になるように意識しながらしゃがみしましょう。どうしても力が入らない場合はスタンス幅を狭めてみるといいかもしれません。',
    positive:
      '膝を外側に出そうとしすぎています。膝を痛める可能性があるので、足と太ももが平行になるように意識しながらしゃがみしましょう。',
  },
  voice: {
    negative: '膝が内側に入りすぎています。',
    normal: '足の向きと太ももの向きが一致していて、とても良いです。',
    positive: '膝を外側に出そうとしすぎているようです。',
  },
  importance: 0.7,
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluateForm: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    const thresholds = { upper: 30, middle: 10, lower: -5 };
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0.0;
    }
    // errorはbottomの膝の開き具合とつま先の開き具合の差。値はニーインの場合負、約0度
    const openingOfKnee = getOpeningOfKnee(bottomPose);
    const openingOfToe = getOpeningOfToe(topPose);
    const error = openingOfKnee - openingOfToe;

    return calculateError(thresholds, error);
  },
  calculateRealtimeValue: (evaluatedPose) => getOpeningOfKnee(evaluatedPose),
  calculateRealtimeThreshold: (criteriaPose) => {
    const openingOfToe = getOpeningOfToe(criteriaPose);

    return { upper: 40 + openingOfToe, middle: 25 + openingOfToe, lower: 10 + openingOfToe };
  },
  getGuidelineSymbols: (rep: Rep): GuidelineSymbols => {
    const guidelineSymbols: GuidelineSymbols = {};
    const thresholds = { upper: 30, middle: 10, lower: -5 };

    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return guidelineSymbols;
    }
    const topWorldLandmarks = topPose.worldLandmarks;
    const bottomWorldLandmarks = bottomPose.worldLandmarks;

    const openingOfToe =
      getAngle(topWorldLandmarks[KJ.ANKLE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(topWorldLandmarks[KJ.ANKLE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).zx;
    const idealThighAngle = (thresholds.middle + openingOfToe) / 2;

    const leftHip = bottomWorldLandmarks[KJ.HIP_LEFT];
    const leftThighLength = getDistance(leftHip, bottomWorldLandmarks[KJ.KNEE_LEFT]).xyz;
    const idealLeftKnee = {
      x: leftHip.x + leftThighLength * Math.sin((idealThighAngle * Math.PI) / 180),
      y: bottomWorldLandmarks[KJ.KNEE_LEFT].y,
      z: leftHip.z - leftThighLength * Math.cos((idealThighAngle * Math.PI) / 180),
    };

    const rightHip = bottomWorldLandmarks[KJ.HIP_RIGHT];
    const rightThighLength = getDistance(rightHip, bottomWorldLandmarks[KJ.KNEE_RIGHT]).xyz;
    const idealRightKnee = {
      x: rightHip.x - rightThighLength * Math.sin((idealThighAngle * Math.PI) / 180),
      y: bottomWorldLandmarks[KJ.KNEE_RIGHT].y,
      z: rightHip.z - rightThighLength * Math.cos((idealThighAngle * Math.PI) / 180),
    };

    guidelineSymbols.points = [landmarkToVector3(idealLeftKnee), landmarkToVector3(idealRightKnee)];

    return guidelineSymbols;
  },
  getCoordinateErrorFromIdeal: (rep: Rep): number => {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const bottomWorldLandmarks = bottomPose.worldLandmarks;
    const topWorldLandmarks = topPose.worldLandmarks;

    // errorはbottomの膝の開き具合とつま先の開き具合の差。値はニーインの場合負、約0度
    const thresholds = { upper: 30, middle: 10, lower: -5 };
    const openingOfKnee =
      getAngle(bottomWorldLandmarks[KJ.HIP_LEFT], bottomWorldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(bottomWorldLandmarks[KJ.HIP_RIGHT], bottomWorldLandmarks[KJ.KNEE_RIGHT]).zx;
    const openingOfToe =
      getAngle(topWorldLandmarks[KJ.ANKLE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(topWorldLandmarks[KJ.ANKLE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).zx;
    const errorInt = Math.round((openingOfKnee - openingOfToe - thresholds.middle) / 2);

    return errorInt;
  },
};

// 足の幅
const stanceWidth: FormInstructionItem = {
  id: 2,
  name: 'Stance width',
  label: '足の幅',
  shortDescription: {
    negative: { beforeNumber: '足の幅を', afterNumber: 'cmほど広くしてください。' },
    normal: { beforeNumber: '足の幅はバッチリです。', afterNumber: '' },
    positive: { beforeNumber: '足の幅を', afterNumber: 'cmほど狭くしてください' },
  },
  longDescription: {
    negative: '足の幅が狭すぎます。腰を落としにくくなってしまうので、足は肩幅より少し広い程度に開きましょう。',
    positive: '足の幅が広すぎます。しゃがんだ時に膝に負担がかかる恐れがあるので、肩幅より少し広い程度に狭めましょう。',
  },
  voice: {
    negative: '足の幅が狭すぎます。足は肩幅より少し広い程度に開きましょう。',
    normal: '足の幅はバッチリです。',
    positive: '足の幅が広すぎます。肩幅より少し広い程度に狭めてみましょう。',
  },
  importance: 0.7,
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluateForm: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const topWorldLandmarks = topPose.worldLandmarks;
    const thresholds = { upper: 2, middle: 1.4, lower: 1 };
    const footWidth = getDistance(topWorldLandmarks[KJ.FOOT_LEFT], topWorldLandmarks[KJ.FOOT_RIGHT]).x;
    const shoulderWidth = getDistance(topWorldLandmarks[KJ.SHOULDER_LEFT], topWorldLandmarks[KJ.SHOULDER_RIGHT]).x;
    const footShoulderWidthRatio = footWidth / shoulderWidth;

    return calculateError(thresholds, footShoulderWidthRatio);
  },
  // FIXME: 座標変換が直感的ではない(landmarkToVector3でyzの正負を反転しているため、直接Vectorを生成した場合と挙動が異なる)
  getGuidelineSymbols: (rep: Rep): GuidelineSymbols => {
    const thresholds = { upper: 2, middle: 1.4, lower: 1 };
    const guidelineSymbols: GuidelineSymbols = {};

    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    if (topWorldLandmarks === undefined) {
      return guidelineSymbols;
    }

    const shoulderWidth = getDistance(topWorldLandmarks[KJ.SHOULDER_LEFT], topWorldLandmarks[KJ.SHOULDER_RIGHT]).x;
    const idealFootWidth = thresholds.middle * shoulderWidth;
    const ankleCenter = getCenter(topWorldLandmarks[KJ.ANKLE_LEFT], topWorldLandmarks[KJ.ANKLE_RIGHT]);
    const idealLeftFootX = ankleCenter.x - idealFootWidth / 2;
    const idealRightFootX = ankleCenter.x + idealFootWidth / 2;
    const leftFoot = topWorldLandmarks[KJ.FOOT_LEFT];
    const rightFoot = topWorldLandmarks[KJ.FOOT_RIGHT];

    guidelineSymbols.points = [
      landmarkToVector3({ x: idealLeftFootX, y: leftFoot.y, z: leftFoot.z }),
      landmarkToVector3({ x: idealRightFootX, y: rightFoot.y, z: rightFoot.z }),
    ];

    return guidelineSymbols;
  },
  calculateRealtimeValue: (evaluatedPose) =>
    getDistance(evaluatedPose.worldLandmarks[KJ.FOOT_LEFT], evaluatedPose.worldLandmarks[KJ.FOOT_RIGHT]).x,
  calculateRealtimeThreshold: (criteriaPose) => {
    const shoulderWidth = getDistance(
      criteriaPose.worldLandmarks[KJ.SHOULDER_LEFT],
      criteriaPose.worldLandmarks[KJ.SHOULDER_RIGHT],
    ).x;

    return { upper: 2 * shoulderWidth, middle: 1.4 * shoulderWidth, lower: 1 * shoulderWidth };
  },
  getCoordinateErrorFromIdeal(rep: Rep): number {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const topWorldLandmarks = topPose.worldLandmarks;
    const thresholds = { upper: 2, middle: 1.4, lower: 1 };
    const footWidth = getDistance(topWorldLandmarks[KJ.FOOT_LEFT], topWorldLandmarks[KJ.FOOT_RIGHT]).x;
    const shoulderWidth = getDistance(topWorldLandmarks[KJ.SHOULDER_LEFT], topWorldLandmarks[KJ.SHOULDER_RIGHT]).x;
    const errorInt = Math.round(footWidth - thresholds.middle * shoulderWidth);

    return errorInt;
  },
};

const kneeFrontAndBack: FormInstructionItem = {
  id: 3,
  name: 'Knee front and back',
  label: '膝の前後位置',
  shortDescription: {
    negative: {
      beforeNumber: 'お尻をあと',
      afterNumber: 'cmほど前に出してください。膝がつま先の少し前に来るように意識しましょう。',
    },
    normal: { beforeNumber: '膝とお尻の前後位置はバッチリです。', afterNumber: '' },
    positive: {
      beforeNumber: 'お尻をあと',
      afterNumber: 'cmほど後ろに引いてください。膝がつま先の少し前に来るように意識しましょう。',
    },
  },
  longDescription: {
    negative:
      'お尻を後ろに引きすぎているようです。膝がつま先より後ろにくると後ろ重心になり、バランスが悪くなります。つま先の上までは膝を出しても大丈夫なので、無理のない姿勢でスクワットしましょう。',
    positive:
      '膝が前に出過ぎています。膝を痛める恐れがあるので、つま先を膝が越えすぎないように注意しましょう。お尻を引きながら腰を落とすイメージです。',
  },
  voice: {
    negative: 'お尻を引きすぎです。',
    normal: 'ちょうど良い膝の曲げ方です。',
    positive: '膝が前に出過ぎています。',
  },
  poseGridCameraAngle: { theta: 90, phi: 0 },
  evaluateForm: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const bottomWorldLandmarks = bottomPose.worldLandmarks;
    const topWorldLandmarks = topPose.worldLandmarks;
    const thresholds = { upper: 15, middle: 1, lower: -1 };

    const kneeFootDistanceZ =
      (getDistance(bottomWorldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z +
        getDistance(bottomWorldLandmarks[KJ.KNEE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).z) /
      2;

    return calculateError(thresholds, kneeFootDistanceZ);
  },
  getCoordinateErrorFromIdeal(rep: Rep): number {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const bottomWorldLandmarks = bottomPose.worldLandmarks;
    const topWorldLandmarks = topPose.worldLandmarks;

    const thresholds = { upper: 15, middle: 1, lower: -1 };
    const kneeFootDistanceZ =
      (getDistance(bottomWorldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z +
        getDistance(bottomWorldLandmarks[KJ.KNEE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).z) /
      2;

    const errorInt = Math.round(kneeFootDistanceZ - thresholds.middle);

    return errorInt;
  },
  calculateRealtimeValue: (evaluatedPose) =>
    (evaluatedPose.worldLandmarks[KJ.KNEE_RIGHT].z + evaluatedPose.worldLandmarks[KJ.KNEE_LEFT].z) / 2,
  calculateRealtimeThreshold: (criteriaPose) => {
    const footZ = (criteriaPose.worldLandmarks[KJ.FOOT_RIGHT].z + criteriaPose.worldLandmarks[KJ.FOOT_LEFT].z) / 2;

    return { upper: footZ + 15, middle: footZ + 1, lower: footZ - 1 };
  },
  getGuidelineSymbols: (rep: Rep): GuidelineSymbols => {
    const thresholds = { upper: 15, middle: 1, lower: -1 };
    const guidelineSymbols: GuidelineSymbols = {};

    const topWorldLandmarks = getTopPose(rep)?.worldLandmarks;
    const bottomWorldLandmarks = getBottomPose(rep)?.worldLandmarks;
    if (bottomWorldLandmarks === undefined || topWorldLandmarks === undefined) {
      return guidelineSymbols;
    }

    const topFootZ = (topWorldLandmarks[KJ.FOOT_RIGHT].z + topWorldLandmarks[KJ.FOOT_LEFT].z) / 2;
    const bottomLeftKnee = bottomWorldLandmarks[KJ.KNEE_LEFT];
    const bottomRightKnee = bottomWorldLandmarks[KJ.KNEE_RIGHT];
    const idealBottomKneeZ = topFootZ - thresholds.middle;

    guidelineSymbols.lines = [
      {
        from: landmarkToVector3({
          x: bottomLeftKnee.x,
          y: (bottomLeftKnee.y + bottomRightKnee.y) / 2,
          z: idealBottomKneeZ,
        }),
        to: landmarkToVector3({
          x: bottomRightKnee.x,
          y: (bottomLeftKnee.y + bottomRightKnee.y) / 2,
          z: idealBottomKneeZ,
        }),
        showEndPoints: true,
      },
    ];

    return guidelineSymbols;
  },
};

const squatVelocity: FormInstructionItem = {
  id: 4,
  name: 'Speed',
  label: '速度',
  shortDescription: {
    negative: {
      beforeNumber: '立ち上がるのが約',
      afterNumber: '秒と少し速いです。2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がってください。',
    },
    normal: { beforeNumber: '速度はバッチリです。', afterNumber: '' },
    positive: {
      beforeNumber: '立ち上がるのに約',
      afterNumber: '秒かかっています。2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がってください。',
    },
  },
  longDescription: {
    negative:
      'スクワットのペースが速いです。ペースが速すぎると反動を使ってしまう上、関節に負担がかかります。もう少しゆっくりの速度で筋肉に効かせるイメージを持ちましょう。目安は1〜2秒かけて立ち上がるくらいです。',
    positive:
      '立ち上がるスピードが遅いです。効かせることも重要ですが、遅すぎる必要はありません。効率よく筋力を発揮するため、1〜2秒かけて立ち上がるようにしましょう。',
  },
  voice: {
    negative: '少し速いです。もう少しゆっくり。',
    normal: 'いい速さです。',
    positive: '少しペースが遅いです。もう少しテンポ良く。',
  },
  poseGridCameraAngle: { theta: 90, phi: 270 },
  evaluateForm: (rep: Rep) => {
    // TODO: エキセントリックも実装したい。
    // TODO: 閾値を再設定
    const thresholds = { upper: 2500, middle: 1500, lower: 500 }; // ミリ秒
    const bottomPose = getBottomPose(rep);
    const lastPose = getLastPose(rep);
    if (bottomPose === undefined || lastPose === undefined) {
      throw new Error('descendingMiddlePose or ascendingMiddlePose is undefined');
    }
    const timeToStandUp = lastPose.timestamp - bottomPose.timestamp;

    return calculateError(thresholds, timeToStandUp);
  },
  getCoordinateErrorFromIdeal(rep: Rep): number {
    const bottomPose = getBottomPose(rep);
    const lastPose = getLastPose(rep);
    if (bottomPose === undefined || lastPose === undefined) {
      console.warn('squatVelocity: bottomPose or lastPose is undefined');

      return 0;
    }
    const timeToStandUP = (lastPose.timestamp - bottomPose.timestamp) / 1000; // ミリ秒 -> 秒に変換

    const error = parseFloat(timeToStandUP.toFixed(1)); // 小数点第一位まで取得

    return error;
  },
  calculateRealtimeValue: (evaluatedPose) => heightInWorld(evaluatedPose),
  calculateRealtimeThreshold: (criteriaPose) => {
    const height = heightInWorld(criteriaPose);

    return { upper: height, middle: height / 2, lower: 0 };
  },
};

// 指導項目を追加したらここにもかく
export const formInstructionItemsQWS = [squatDepth, kneeInAndOut, stanceWidth, kneeFrontAndBack, squatVelocity];
