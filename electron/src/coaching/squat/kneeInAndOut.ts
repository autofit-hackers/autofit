import kneeInAndOutImage from '../../../resources/images/formInstructionItems/knee-in-and-out.png';
import { getAngle, getDistance, KJ, landmarkToVector3, normalizeAngle, Pose } from '../../training_data/pose';
import { getBottomPose, getTopPose, Rep } from '../../training_data/rep';
import { GuidelineSymbols } from '../../utils/poseGrid';
import { calculateError, Checkpoint, Thresholds } from '../formEvaluation';

export const getOpeningOfKnee = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).zx,
    'positive-inferior',
  );

export const getOpeningOfToe = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.ANKLE_LEFT], pose.worldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.ANKLE_RIGHT], pose.worldLandmarks[KJ.FOOT_RIGHT]).zx,
    'positive-inferior',
  );

const kneeInAndOut: Checkpoint = {
  id: 1,
  nameEN: 'Knee in and out',
  nameJP: 'ひざの開き',
  iconImageUrl: kneeInAndOutImage,
  lectureVideoUrl: 'https://www.youtube.com/watch?v=Q9Z9Z9Z9Z9Z',
  evaluationTextTemplate: {
    negative: {
      beforeNumber: '膝が適切な角度より',
      afterNumber:
        '度ほど内側に入っています。つま先とひざの向きを揃えるようにしてください。膝が内側に入り込んでしまうと、大腿骨の内側と外側にある筋肉の働きを弱めてしまいます。',
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
  voice: {
    negative: '膝が内側に入りすぎています。',
    normal: '足の向きと太ももの向きが一致していて、とても良いです。',
    positive: '膝を外側に出そうとしすぎているようです。',
  },
  poseGridCameraAngle: { theta: 90, phi: 270 },
  thresholds: { upper: 40, middle: 25, lower: 10 },
  evaluateForm: (rep: Rep, thresholds: Thresholds) => {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
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
  getGuidelineSymbols: (rep: Rep, thresholds: Thresholds): GuidelineSymbols => {
    const guidelineSymbols: GuidelineSymbols = {};

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
      y: (bottomWorldLandmarks[KJ.KNEE_LEFT].y + bottomWorldLandmarks[KJ.KNEE_RIGHT].y) / 2,
      z: leftHip.z - leftThighLength * Math.cos((idealThighAngle * Math.PI) / 180),
    };

    const rightHip = bottomWorldLandmarks[KJ.HIP_RIGHT];
    const rightThighLength = getDistance(rightHip, bottomWorldLandmarks[KJ.KNEE_RIGHT]).xyz;
    const idealRightKnee = {
      x: rightHip.x - rightThighLength * Math.sin((idealThighAngle * Math.PI) / 180),
      y: (bottomWorldLandmarks[KJ.KNEE_LEFT].y + bottomWorldLandmarks[KJ.KNEE_RIGHT].y) / 2,
      z: rightHip.z - rightThighLength * Math.cos((idealThighAngle * Math.PI) / 180),
    };

    guidelineSymbols.lines = [
      {
        from: landmarkToVector3({ ...idealLeftKnee, y: idealLeftKnee.y - 15 }),
        to: landmarkToVector3({ ...idealLeftKnee, y: idealLeftKnee.y + 15 }),
        showEndPoints: false,
      },
      {
        from: landmarkToVector3({ ...idealRightKnee, y: idealRightKnee.y - 15 }),
        to: landmarkToVector3({ ...idealRightKnee, y: idealRightKnee.y + 15 }),
        showEndPoints: false,
      },
    ];

    return guidelineSymbols;
  },
  getCoordinateErrorFromIdeal: (rep: Rep, thresholds: Thresholds): number => {
    const bottomPose = getBottomPose(rep);
    const topPose = getTopPose(rep);
    if (bottomPose === undefined || topPose === undefined) {
      console.warn('kneeInAndOut: bottomPose or topPose is undefined');

      return 0;
    }

    // errorはbottomの膝の開き具合とつま先の開き具合の差。値はニーインの場合負、約0度
    const openingOfKnee = getOpeningOfKnee(bottomPose);
    const openingOfToe = getOpeningOfToe(topPose);

    const errorInt = Math.round((openingOfKnee - openingOfToe - thresholds.middle) / 2);

    return errorInt;
  },
};

export default kneeInAndOut;
