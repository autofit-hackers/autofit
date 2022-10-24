import { calculateError, Checkpoint, Thresholds } from '../formEvaluation';
import { Rep, getBottomPose, getLastPose } from '../../training_data/rep';
import squatVelocityImage from '../../../resources/images/formInstructionItems/squat-velocity.png';

const velocity: Checkpoint = {
  id: 1,
  nameEN: 'Velocity',
  nameJP: '速度',
  iconImageUrl: squatVelocityImage,
  lectureVideoUrl: '../../../resources/movie/squat-speed.mov',
  evaluationTextTemplate: {
    negative: {
      beforeNumber: '立ち上がるのが約',
      afterNumber:
        '秒と少し速いです。ペースが速すぎると反動を使ってしまう上、関節に負担がかかります。もう少しゆっくりの速度で筋肉に効かせるイメージを持ちましょう。目安は2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるくらいです。',
    },
    normal: {
      beforeNumber: 'スクワットの速度はバッチリです。2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるのが一般的です。',
      afterNumber: '',
    },
    positive: {
      beforeNumber: '立ち上がるのに約',
      afterNumber:
        '秒かかっています。効かせることも重要ですが、遅すぎる必要はありません。効率よく筋力を発揮するため、2〜3秒かけてしゃがみ、1〜2秒かけて立ち上がるようにしましょう。',
    },
  },
  voice: {
    negative: '少し速いです。もう少しゆっくり。',
    normal: 'いい速さです。',
    positive: '少しペースが遅いです。もう少しテンポ良く。',
  },
  RGBcameraAngle: 'front',
  poseGridCameraAngle: { theta: 90, phi: 270 },
  thresholds: { upper: 2500, middle: 1500, lower: 500 }, // ミリ秒
  evaluateForm: (rep: Rep, thresholds: Thresholds) => {
    // TICKET: エキセントリックも実装したい。
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
    const timeToStandUp = (lastPose.timestamp - bottomPose.timestamp) / 1000; // ミリ秒 -> 秒に変換

    const error = parseFloat(timeToStandUp.toFixed(1)); // 小数点第一位まで取得

    return error;
  },
};

export default velocity;
