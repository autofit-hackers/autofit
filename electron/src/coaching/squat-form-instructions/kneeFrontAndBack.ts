import { getDistance, KJ, landmarkToVector3 } from '../../training_data/pose';
import { Rep, getBottomPose, getTopPose } from '../../training_data/rep';
import { GuidelineSymbols } from '../../utils/poseGrid';
import { FormInstructionItem, calculateError } from '../formInstruction';
import kneeFrontAndBackImage from '../../../resources/images/formInstructionItems/knee-front-and-back.png';

const kneeFrontAndBack: FormInstructionItem = {
  id: 3,
  name: 'Knee front and back',
  label: '膝の前後位置',
  image: kneeFrontAndBackImage,
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
  fixedDescription:
    '足の筋肉をバランスよく鍛えるためには、膝が前に出すぎないように注意すると良いでしょう。膝が前に出すぎると、大腿四頭筋ばかりが動員され、ハムストリングや腓腹筋への負荷が弱くなってしまいます。また、怪我の原因にもなるので注意が必要です。',
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
    const idealBottomKneeZ = topFootZ - thresholds.middle;
    const pelvis = bottomWorldLandmarks[KJ.PELVIS];
    const footY = (topWorldLandmarks[KJ.FOOT_RIGHT].y + topWorldLandmarks[KJ.FOOT_LEFT].y) / 2;

    guidelineSymbols.lines = [
      {
        from: landmarkToVector3({
          x: pelvis.x,
          y: footY,
          z: idealBottomKneeZ,
        }),
        to: landmarkToVector3({
          x: pelvis.x,
          y: pelvis.y,
          z: idealBottomKneeZ,
        }),
        showEndPoints: true,
      },
    ];

    return guidelineSymbols;
  },
};

export default kneeFrontAndBack;
