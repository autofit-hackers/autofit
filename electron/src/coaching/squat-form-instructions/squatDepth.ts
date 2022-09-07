import { calculateError, FormInstructionItem, Thresholds } from '../formInstruction';
import squatDepthImage from '../../../resources/images/formInstructionItems/squat-depth.png';
import { KJ, getDistance, landmarkToVector3, getAngle, normalizeAngle, Pose } from '../../training_data/pose';
import { Rep, getBottomPose } from '../../training_data/rep';
import { GuidelineSymbols } from '../../utils/poseGrid';

const getThighAngleFromSide = (pose: Pose): number => {
  const leftThighAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).yz,
    'permit-negative-inferior',
  );
  const rightThighAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).yz,
    'permit-negative-inferior',
  );
  const meanThighAngleFromSide = (leftThighAngleFromSide + rightThighAngleFromSide) / 2;

  return meanThighAngleFromSide;
};

const squatDepth: FormInstructionItem = {
  id: 0,
  name: 'Squat depth',
  label: 'しゃがむ深さ',
  image: squatDepthImage,
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
  fixedDescription:
    '太ももと床が平行になるまで腰を落としましょう。腰を下ろす途中で背中が丸まってしまう場合は、無理せずに背中が丸まらない位置までにしましょう。しゃがみが浅いと、太ももの裏側やお尻の筋肉への負荷が少なくなってしまいます。',
  voice: {
    negative: '腰を太ももが平行になるまで落としましょう。',
    normal: 'ちょうどよい深さで腰を落とせています。この調子。',
    positive: '腰は太ももが床と平行になるところまで落とせば十分です。',
  },
  importance: 0.5,
  poseGridCameraAngle: { theta: 90, phi: 0 },
  thresholds: { upper: 100, middle: 80, lower: 60 },
  // しゃがみが深いほど角度は大きい
  evaluateForm: (rep: Rep, thresholds: Thresholds) => {
    const bottomPose = getBottomPose(rep);
    // TODO: 浅いほうを厳しく、深いほうを甘くする
    if (bottomPose === undefined) {
      return 0.0;
    }
    const meanThighAngleFromSide = getThighAngleFromSide(bottomPose);

    return calculateError(thresholds, meanThighAngleFromSide);
  },
  calculateRealtimeValue: (evaluatedPose) => getThighAngleFromSide(evaluatedPose),
  calculateRealtimeThreshold: () => ({ upper: 90, middle: 80, lower: 60 }),
  getGuidelineSymbols: (rep: Rep, thresholds: Thresholds): GuidelineSymbols => {
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
    const pelvis = bottomPose.worldLandmarks[KJ.PELVIS];
    const bottomKneeZ = (bottomPose.worldLandmarks[KJ.KNEE_LEFT].z + bottomPose.worldLandmarks[KJ.KNEE_RIGHT].z) / 2;

    guidelineSymbols.lines = [
      {
        from: landmarkToVector3({ x: pelvis.x, y: idealHipY, z: pelvis.z + 10 }),
        to: landmarkToVector3({ x: pelvis.x, y: idealHipY, z: bottomKneeZ }),
        showEndPoints: false,
      },
    ];

    return guidelineSymbols;
  },
  getCoordinateErrorFromIdeal: (rep: Rep, thresholds: Thresholds): number => {
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

export default squatDepth;
