import { Thresholds, FormInstructionItem, calculateError } from '../formInstruction';
import { heightInWorld } from '../../training_data/pose';
import { Rep, getBottomPose, getLastPose } from '../../training_data/rep';
import squatVelocityImage from '../../../resources/images/formInstructionItems/squat-velocity.png';

const squatVelocity: FormInstructionItem = {
  id: 4,
  name: 'Speed',
  label: '速度',
  image: squatVelocityImage,
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
  fixedDescription:
    'しゃがんだ反動に頼って立ち上がっていると、筋肉への刺激が軽減してしまいます。反動に頼らず、しゃがみ込むときはゆっくりと、立ち上がるときは素早く動作することを心がけましょう。ただし、動きが速すぎると怪我の原因になるため注意しましょう。',
  voice: {
    negative: '少し速いです。もう少しゆっくり。',
    normal: 'いい速さです。',
    positive: '少しペースが遅いです。もう少しテンポ良く。',
  },
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
  calculateRealtimeValue: (evaluatedPose) => heightInWorld(evaluatedPose),
  calculateRealtimeThreshold: (criteriaPose) => {
    const height = heightInWorld(criteriaPose);

    return { upper: height, middle: height / 2, lower: 0 };
  },
};

export default squatVelocity;
