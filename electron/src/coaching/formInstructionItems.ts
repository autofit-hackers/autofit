import { angleInZX, distanceBetweenX, distanceBetweenXYZ, midpointBetween } from '../training/pose';
import { getBottomPose, getTopPose, Rep } from '../training/rep';

export type FormInstructionItem = {
  readonly text: string;
  readonly evaluate: (rep: Rep) => boolean;
  readonly showGuideline?: (rep: Rep) => void;
  readonly reason?: string;
  readonly recommendMenu?: string[];
};

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

// バーベルは足の中心の真上を移動
const barbellOnFootCenter: FormInstructionItem = {
  text: 'Barbel on foot center',
  // 手首の中心をバーベルと推定して実行
  // 毎フレーム(サンプリングしても良い)
  evaluate: (rep: Rep) => {
    // TODO: マイフレームごとに書き換えること
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      throw new Error('topPose is undefined');
    }
    const topPoseWrist = midpointBetween(topPose.landmark[3], topPose.landmark[7]);
    const topPoseAnkle = midpointBetween(topPose.landmark[20], topPose.landmark[24]);
    const topPoseFoot = midpointBetween(topPoseAnkle, topPoseWrist);
    const topDistanceFoot = distanceBetweenXYZ(topPose.landmark[20], topPose.landmark[21]);

    // キーフレーム検出ができていなかった場合はクリアとする
    if (
      topPoseWrist === undefined ||
      topPoseAnkle === undefined ||
      topPoseFoot === undefined ||
      topDistanceFoot === undefined
    ) {
      return true;
    }
    // TODO: acceptableErrorについて検証
    // TODO: 足の中心を表せているかについて検証
    const acceptableError = 0.1;
    if (topPoseWrist.x >= (topPoseAnkle.x + topPoseFoot.x) / 2 - topDistanceFoot * acceptableError) {
      if (topPoseWrist.x <= (topPoseAnkle.x + topPoseFoot.x) / 2 + topDistanceFoot * acceptableError) {
        if (topPoseWrist.z >= (topPoseAnkle.x + topPoseFoot.x) / 2 - topDistanceFoot * acceptableError) {
          if (topPoseWrist.z >= (topPoseAnkle.x + topPoseFoot.x) / 2 - topDistanceFoot * acceptableError) {
            return true;
          }
        }
      }
    }

    return false;
  },
};

// スクワットの深さ
const squatDepth: FormInstructionItem = {
  text: 'Squat depth',
  // bottomで判定
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      throw new Error('bottomPose is undefined');
    }
    const bottomPoseKnee = midpointBetween(bottomPose.landmark[19], bottomPose.landmark[23]);

    // キーフレーム検出ができていなかった場合はクリアとする
    if (bottomPoseKnee === undefined) {
      return true;
    }
    // TODO: 十分に腰が下がっているかを判定可能か?
    const isCleared = bottomPose.landmark[0].y <= bottomPoseKnee.y;

    return isCleared;
  },
};

// 真上から見た太ももの角度と踵の角度が等しい
const kneeOut: FormInstructionItem = {
  text: 'Knee out',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      throw new Error('bottomPose is undefined');
    }
    const bottomPoseLeftThighAngle = angleInZX(bottomPose.landmark[18], bottomPose.landmark[19]);
    const bottomPoseRightThighAngle = angleInZX(bottomPose.landmark[22], bottomPose.landmark[23]);
    const bottomPoseLeftFootAngle = angleInZX(bottomPose.landmark[20], bottomPose.landmark[21]);
    const bottomPoseRightFootAngle = angleInZX(bottomPose.landmark[24], bottomPose.landmark[25]);
    // キーフレーム検出ができていなかった場合はクリアとする
    if (
      bottomPoseLeftThighAngle === undefined ||
      bottomPoseRightThighAngle === undefined ||
      bottomPoseLeftFootAngle === undefined ||
      bottomPoseRightFootAngle === undefined
    ) {
      return true;
    }

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.1;
    if (
      Math.abs(bottomPoseLeftThighAngle - bottomPoseLeftFootAngle) <=
      acceptableError * Math.abs(bottomPoseLeftFootAngle)
    ) {
      if (
        Math.abs(bottomPoseRightThighAngle - bottomPoseRightFootAngle) <=
        acceptableError * Math.abs(bottomPoseRightFootAngle)
      ) {
        return true;
      }
    }

    return false;
  },
};

// 背中が反っていない
// とりあえず，topとbottomだけで実装する．（今後，前後のフレームを追加する可能性あり）

// 背中の傾き
// bottomで判定

// つま先の角度
const feetAngle: FormInstructionItem = {
  text: 'Feet angle',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      throw new Error('topPose is undefined');
    }
    const topPoseLeftFootAngle = angleInZX(topPose.landmark[20], topPose.landmark[21]);
    const topPoseRightFootAngle = angleInZX(topPose.landmark[24], topPose.landmark[25]);

    // キーフレーム検出ができていなかった場合はクリアとする
    if (topPoseLeftFootAngle === undefined || topPoseRightFootAngle === undefined) {
      return true;
    }

    // TODO: acceptableErrorについて検証
    // TODO: 体の前後を見分けるために，absでなく，正負を残しても良い
    const acceptableError = 0.1;
    if (Math.abs(topPoseLeftFootAngle) <= ((1 + acceptableError) * Math.PI * 30) / 180) {
      if (Math.abs(topPoseLeftFootAngle) <= ((1 - acceptableError) * Math.PI * 30) / 180) {
        if (Math.abs(topPoseRightFootAngle) <= ((1 + acceptableError) * Math.PI * 30) / 180) {
          if (Math.abs(topPoseRightFootAngle) <= ((1 - acceptableError) * Math.PI * 30) / 180) {
            return true;
          }
        }
      }
    }

    return false;
  },
};

// 足のうらがべったり地面につく
// topとbottomを比較
// TODO: 角度で比較するか，位置で比較するかを検討
const feetGround: FormInstructionItem = {
  text: 'Feet ground',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    const bottomPose = getBottomPose(rep);
    if (topPose === undefined) {
      throw new Error('topPose is undefined');
    }
    if (bottomPose === undefined) {
      throw new Error('bottomPose is undefined');
    }
    // const topPoseLeftAnkleChange = distanceBetweenXYZ(topPose.landmark[20], bottomPose.landmark[20]);
    // const topPoseRightAnkleChange = distanceBetweenXYZ(topPose.landmark[24], bottomPose.landmark[24]);
    // const topPoseLeftFootChange = distanceBetweenXYZ(topPose.landmark[21], bottomPose.landmark[21]);
    // const topPoseRightFootChange = distanceBetweenXYZ(topPose.landmark[21], bottomPose.landmark[21]);
    // // 判定に使用
    // const topPoseShoulder = distanceBetweenXYZ(topPose.landmark[5], topPose.landmark[12]);
    // キーフレーム検出ができていなかった場合はクリアとする
    // if (
    //   topPoseLeftShoulderAnkle === undefined ||
    //   topPoseRightShoulderAnkle === undefined ||
    //   topPoseShoulder === undefined
    // ) {
    //   return true;
    // }

    // // TODO: acceptableErrorについて検証
    // const acceptableError = 0.1;
    // if (topPoseLeftShoulderAnkle <= acceptableError * topPoseShoulder) {
    //   if (topPoseRightShoulderAnkle <= acceptableError * topPoseShoulder) {
    //     return true;
    //   }
    // }

    return false;
  },
};

// 視線
// bottomで判定する

// スタンス
// 踵の幅と肩幅が同じ
const feetWidth: FormInstructionItem = {
  text: 'Feet width',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      throw new Error('topPose is undefined');
    }
    const topPoseLeftShoulderAnkle = distanceBetweenX(topPose.landmark[5], topPose.landmark[20]);
    const topPoseRightShoulderAnkle = distanceBetweenX(topPose.landmark[12], topPose.landmark[24]);
    // 判定に使用
    const topPoseShoulder = distanceBetweenXYZ(topPose.landmark[5], topPose.landmark[12]);
    // キーフレーム検出ができていなかった場合はクリアとする
    if (
      topPoseLeftShoulderAnkle === undefined ||
      topPoseRightShoulderAnkle === undefined ||
      topPoseShoulder === undefined
    ) {
      return true;
    }

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.1;
    if (topPoseLeftShoulderAnkle <= acceptableError * topPoseShoulder) {
      if (topPoseRightShoulderAnkle <= acceptableError * topPoseShoulder) {
        return true;
      }
    }

    return false;
  },
};

// バーベルを担ぐ位置

// TopとButtomだけでは厳しい
// ラックの高さ

// 膝先がつま先から見てどれだけ前方or後方にあるか
// bottomで判定

// 指導項目を追加したらここにもかく
export const formInstructionItems: FormInstructionItem[] = [
  barbellOnFootCenter,
  squatDepth,
  kneeOut,
  feetAngle,
  feetWidth,
  feetGround,
];
