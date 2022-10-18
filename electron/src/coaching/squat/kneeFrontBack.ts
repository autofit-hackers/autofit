import { calculateError, Checkpoint, Thresholds } from '../formEvaluation';
import { getDistance, KJ, landmarkToVector3 } from '../../training_data/pose';
import { Rep, getBottomPose, getTopPose } from '../../training_data/rep';
import { GuidelineSymbols } from '../../utils/poseGrid';
import kneeFrontAndBackImage from '../../../resources/images/formInstructionItems/knee-front-and-back.png';

const kneeFrontBack: Checkpoint = {
  id: 2,
  nameEN: 'Knee front and back',
  nameJP: '姿勢',
  iconImageUrl: kneeFrontAndBackImage,
  lectureVideoUrl: '../../../resources/movie/squat-posture.mov',
  evaluationTextTemplate: {
    negative: {
      beforeNumber: 'お尻をあと',
      afterNumber:
        'cmほど前に出してください。膝がつま先より後ろにくると後ろ重心になり、バランスが悪くなります。つま先の上までは膝を出しても大丈夫なので、無理のない姿勢でスクワットしましょう。',
    },
    normal: {
      beforeNumber:
        '膝とお尻の前後位置はバッチリです。膝を痛める恐れがあるので、つま先が前に出すぎないように今後も意識してください。',
      afterNumber: '',
    },
    positive: {
      beforeNumber: 'お尻をあと',
      afterNumber:
        'cmほど後ろに引いてください。膝を痛める恐れがあるので、つま先を膝が越えすぎないように注意しましょう。お尻を引きながら腰を落とすイメージです。',
    },
  },
  voice: {
    negative: 'お尻を引きすぎです。',
    normal: 'ちょうど良い膝の曲げ方です。',
    positive: '膝が前に出過ぎています。',
  },
  poseGridCameraAngle: { theta: 90, phi: 180 },
  thresholds: { upper: 15, middle: 1, lower: -1 },
  evaluateForm: (rep: Rep, thresholds: Thresholds) => {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const bottomWorldLandmarks = bottomPose.worldLandmarks;
    const topWorldLandmarks = topPose.worldLandmarks;

    const kneeFootDistanceZ =
      (getDistance(bottomWorldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z +
        getDistance(bottomWorldLandmarks[KJ.KNEE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).z) /
      2;

    return calculateError(thresholds, kneeFootDistanceZ);
  },
  getCoordinateErrorFromIdeal(rep: Rep, thresholds: Thresholds): number {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }
    const bottomWorldLandmarks = bottomPose.worldLandmarks;
    const topWorldLandmarks = topPose.worldLandmarks;

    const kneeFootDistanceZ =
      (getDistance(bottomWorldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z +
        getDistance(bottomWorldLandmarks[KJ.KNEE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).z) /
      2;

    const errorInt = Math.round(kneeFootDistanceZ - thresholds.middle);

    return errorInt;
  },
  getGuidelineSymbols: (rep: Rep, thresholds: Thresholds): GuidelineSymbols => {
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

export default kneeFrontBack;
