import { getDistance, KJ, getCenter, landmarkToVector3 } from '../../training_data/pose';
import { Rep, getTopPose } from '../../training_data/rep';
import { GuidelineSymbols } from '../../utils/poseGrid';
import { FormInstructionItem, calculateError } from '../formInstruction';
import stanceWidthImage from '../../../resources/images/formInstructionItems/stance-width.png';

const stanceWidth: FormInstructionItem = {
  id: 2,
  name: 'Stance width',
  label: '足の幅',
  image: stanceWidthImage,
  shortDescription: {
    negative: { beforeNumber: '足の幅を', afterNumber: 'cmほど広くしてください。' },
    normal: { beforeNumber: '足の幅はバッチリです。', afterNumber: '' },
    positive: { beforeNumber: '足の幅を', afterNumber: 'cmほど狭くしてください' },
  },
  longDescription: {
    negative: '足の幅が狭すぎます。腰を落としにくくなってしまうので、足は肩幅より少し広い程度に開きましょう。',
    positive: '足の幅が広すぎます。しゃがんだ時に膝に負担がかかる恐れがあるので、肩幅より少し広い程度に狭めましょう。',
  },
  fixedDescription:
    '足幅は、踵の位置が肩幅と同じくらいになるように開きましょう。足幅が狭すぎるとしゃがみが浅くなり、ハムストリングスや内転筋群の動員が弱まります。広すぎると腱や靭帯に過剰な負荷がかかってしまいます。',
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
    const shoulderY = (topWorldLandmarks[KJ.SHOULDER_LEFT].y + topWorldLandmarks[KJ.SHOULDER_RIGHT].y) / 2;

    guidelineSymbols.lines = [
      {
        from: landmarkToVector3({ x: idealLeftFootX, y: leftFoot.y, z: leftFoot.z }),
        to: landmarkToVector3({ x: idealLeftFootX, y: shoulderY, z: leftFoot.z }),
        showEndPoints: false,
      },
      {
        from: landmarkToVector3({ x: idealRightFootX, y: rightFoot.y, z: rightFoot.z }),
        to: landmarkToVector3({ x: idealRightFootX, y: shoulderY, z: rightFoot.z }),
        showEndPoints: false,
      },
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

export default stanceWidth;
