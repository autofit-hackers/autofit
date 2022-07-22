import { midpointBetween } from '../training/pose';
import { getTopPose, Rep } from '../training/rep';

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
    // マイフレームごとに書き換えること
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      throw new Error('topPose is undefined');
    }
    const topPoseWrist = midpointBetween(topPose.landmark[3], topPose.landmark[7]);
    const topPoseAnkle = midpointBetween(topPose.landmark[20], topPose.landmark[24]);
    const topPoseFoot = midpointBetween(topPoseAnkle, topPoseWrist);

    // キーフレーム検出ができていなかった場合はクリアとする
    if (topPoseWrist === undefined || topPoseAnkle === undefined || topPoseFoot === undefined) {
      return true;
    }
    // TODO: check if y is 0 at bottom of the frame
    const isCleared = topPoseWrist.x <= (topPoseAnkle.x + topPoseFoot.x) / 2;

    return isCleared;
  },
};

// スクワットの深さ
/* const squatDepth: FormInstructionItem = {
  text: 'Squat depth',
  // bottomで判定
  evaluate: (rep: Rep) => {
    const topPoseKnee = getTopPose(rep)?.kneeCenter();
    const bottomPoseHip = getBottomPose(rep)?.hipCenter();

    // キーフレーム検出ができていなかった場合はクリアとする
    if (topPoseKnee === undefined || bottomPoseHip === undefined) {
      return true;
    }
    // TODO: check if y is 0 at bottom of the frame
    const isCleared = bottomPoseHip.y <= topPoseKnee.y;

    return isCleared;
  },
}; */

// 真上から見た太ももの角度と踵の角度が等しい
// bottomで判定する
/* const kneeOut: FormInstructionItem = {
  text: 'Knee out',
  evaluate: (rep: Rep) => {
    // undefinedの可能性があるためoptional chaining(?.)を使用
    const topPoseKneeDistance = getTopPose(rep)?.kneesDistance();
    const bottomPoseKneeDistance = getBottomPose(rep)?.kneesDistance();

    // キーフレーム検出ができていなかった場合はクリアとする
    if (topPoseKneeDistance === undefined || bottomPoseKneeDistance === undefined) {
      return true;
    }

    // TODO: improve algorithm
    const isCleared = bottomPoseKneeDistance <= topPoseKneeDistance;

    return isCleared;
  },
}; */

// 背中が反っていない
// とりあえず，topとbottomだけで実装する．（今後，前後のフレームを追加する可能性あり）

// 背中の傾き
// bottomで判定

// つま先の角度
// topで判定

// 足のうらがべったり地面につく
// topとbottomを比較

// 視線
// bottomで判定する

// スタンス
// 踵の幅と肩幅が同じ
/* const feetWidth: FormInstructionItem = {
  text: 'Feet width',
  evaluate: (rep: Rep) => {
    const topPoseHeelDistance = getTopPose(rep)?.heelDistance();
    const topPoseShoulderDistance = getTopPose(rep)?.shoulderDistance();
    // キーフレーム検出ができていなかった場合はクリアとする
    if (topPoseHeelDistance === undefined || topPoseShoulderDistance === undefined) {
      return true;
    }
    // TODO: improve algorithm
    // 左右の踵の距離が肩幅の0.9倍以上1.1倍以下
    // if (bottomPoseHip.y <= topPoseKnee.y * 1.1 && bottomPoseHip.y >= topPoseKnee.y * 0.9) {
    // return true;
    // }
    const isCleared = topPoseHeelDistance <= topPoseShoulderDistance;

    return isCleared;
  },
}; */

// バーベルを担ぐ位置

// TopとButtomだけでは厳しい
// ラックの高さ

// 膝先がつま先から見てどれだけ前方or後方にあるか
// bottomで判定

// 指導項目を追加したらここにもかく
export const formInstructionItems: FormInstructionItem[] = [barbellOnFootCenter];
