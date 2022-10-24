import squatDepthImage from '../../../resources/images/formInstructionItems/squat-depth.png';
import { getAngle, getDistance, KJ, landmarkToVector3, normalizeAngle, Pose } from '../../training_data/pose';
import { getBottomPose, Rep } from '../../training_data/rep';
import { GuidelineSymbols } from '../../utils/poseGrid';
import { calculateError, Checkpoint, Thresholds } from '../formEvaluation';

const getBackBentAngleFromSide = (pose: Pose): number => {
  const upperBackAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.SPINE_CHEST], pose.worldLandmarks[KJ.NECK]).yz,
    'permit-negative-inferior',
  );
  const lowerBackAngleFromSide = normalizeAngle(
    -getAngle(pose.worldLandmarks[KJ.SPINE_NAVEL], pose.worldLandmarks[KJ.PELVIS]).yz,
    'permit-negative-inferior',
  );
  const backBentAngleFromSide = (upperBackAngleFromSide - lowerBackAngleFromSide) / 2;

  return backBentAngleFromSide;
};

const backBent: Checkpoint = {
  id: 3,
  nameEN: 'Back bent',
  nameJP: '背中の丸まり/反り',
  iconImageUrl: squatDepthImage,
  lectureVideoUrl: '../../../resources/movie/squat-depth.mov',
  evaluationTextTemplate: {
    negative: {
      beforeNumber: '',
      afterNumber:
        '度ほど腰が丸まりすぎている可能性があります。腰が丸まってしまうと腰への負担が大きくなり怪我や痛みにつながる可能性があります。',
    },
    normal: {
      beforeNumber: '左の動画のように、良い姿勢でスクワットができています。次回以降も意識して継続してください。',
      afterNumber: '',
    },
    positive: {
      beforeNumber: '',
      afterNumber: '度ほど腰が反りすぎている可能性があります。お尻を引き締めるイメージを持つと良いでしょう。',
    },
  },
  voice: {
    negative: '背中が丸まっています。胸を張ってください。',
    normal: '良い姿勢です。',
    positive: '背中が反りすぎています。お尻を引き締めましょう。',
  },
  poseGridCameraAngle: { theta: 90, phi: 180 },
  thresholds: { upper: 100, middle: 90, lower: 85 },
  // しゃがみが深いほど角度は大きい
  evaluateForm: (rep: Rep, thresholds: Thresholds) => {
    const bottomPose = getBottomPose(rep);

    if (bottomPose === undefined) {
      return 0.0;
    }
    const backBentAngleFromSide = getBackBentAngleFromSide(bottomPose);

    return calculateError(thresholds, backBentAngleFromSide);
  },
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

export default backBent;
