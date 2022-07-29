import {
  angleInYZ,
  angleInZX,
  distanceInX,
  distanceInXYZ,
  distanceInY,
  distanceInZ,
  distanceInZX,
  midpointBetween,
} from '../training/pose';
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
  evaluate: (rep: Rep) => {
    // 毎フレーム(サンプリングしても良い)
    // TODO: マイフレームごとに書き換えること
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return true;
    }
    // 手首の中心をバーベルと推定して実行
    const topPoseWristCenter = midpointBetween(topPose.worldLandmarks[7], topPose.worldLandmarks[14]);
    const topPoseAnkleCenter = midpointBetween(topPose.worldLandmarks[20], topPose.worldLandmarks[24]);
    const topPoseFootCenter = midpointBetween(topPose.worldLandmarks[21], topPose.worldLandmarks[25]);
    // 誤差の許容値を得るために使用
    // TODO 動作中，一定に近い値をとる場所を特定
    const topDistanceRightFoot = distanceInXYZ(topPose.worldLandmarks[24], topPose.worldLandmarks[25]);
    // TODO: acceptableErrorについて検証
    // TODO: 足の中心を表せているかについて検証
    // TODO: 関数を分ける
    const acceptableError = 0.1;
    if (
      topPoseWristCenter.x >=
      (topPoseAnkleCenter.x + topPoseFootCenter.x) / 2 + topDistanceRightFoot * acceptableError
    ) {
      // バーベルが左に寄っている
      // console.log('バーベルが左に寄っている');

      return false;
    }
    if (
      topPoseWristCenter.x <=
      (topPoseAnkleCenter.x + topPoseFootCenter.x) / 2 - topDistanceRightFoot * acceptableError
    ) {
      // バーベルが右に寄っている
      return false;
    }
    if (
      topPoseWristCenter.z <=
      (topPoseAnkleCenter.z + topPoseFootCenter.z) / 2 - topDistanceRightFoot * acceptableError
    ) {
      // バーベルが前すぎる
      return false;
    }
    if (
      topPoseWristCenter.z >=
      (topPoseAnkleCenter.z + topPoseFootCenter.z) / 2 + topDistanceRightFoot * acceptableError
    ) {
      // バーベルが後ろすぎる
      return false;
    }

    return true;
  },
};

// スクワットの深さ
const squatDepth: FormInstructionItem = {
  text: 'Squat depth',
  // bottomで判定
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const bottomPoseKnee = midpointBetween(bottomPose.worldLandmarks[19], bottomPose.worldLandmarks[23]);
    // TODO: 十分に腰が下がっているかを判定可能か?
    // TODO: 桂以外の人でも判定できるようにする
    const numKTR = 50.0;
    const squatDepthCheck = bottomPose.worldLandmarks[0].y - bottomPoseKnee.y + numKTR;

    // TODO: デバック用
    if (squatDepthCheck <= 0.0) {
      console.log('腰の下げ方が足りない');
      console.log(squatDepthCheck);

      return false;
    }

    console.log('十分に腰を落とした');
    console.log(squatDepthCheck);

    return true;
  },
};

// 真上から見た太ももの角度と踵の角度が等しい
const kneeOut: FormInstructionItem = {
  text: 'Knee out',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const bottomPoseLeftThighAngleZX = angleInZX(bottomPose.worldLandmarks[18], bottomPose.worldLandmarks[19]);
    const bottomPoseRightThighAngleZX = angleInZX(bottomPose.worldLandmarks[22], bottomPose.worldLandmarks[23]);
    const bottomPoseLeftFootAngleZX = angleInZX(bottomPose.worldLandmarks[20], bottomPose.worldLandmarks[21]);
    const bottomPoseRightFootAngleZX = angleInZX(bottomPose.worldLandmarks[24], bottomPose.worldLandmarks[25]);

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.1;
    // TODO: 左右の足がどのようにずれているのか，関数を分ける
    if (
      bottomPoseLeftThighAngleZX - bottomPoseLeftFootAngleZX >=
      acceptableError * Math.abs(bottomPoseLeftFootAngleZX)
    ) {
      // 左太ももと左足が同じ方向を向いていない
      return false;
    }
    if (
      bottomPoseLeftThighAngleZX - bottomPoseLeftFootAngleZX <=
      -acceptableError * Math.abs(bottomPoseLeftFootAngleZX)
    ) {
      // 左太ももと左足が同じ方向を向いていない
      return false;
    }
    if (
      bottomPoseRightThighAngleZX - bottomPoseRightFootAngleZX >=
      acceptableError * Math.abs(bottomPoseRightFootAngleZX)
    ) {
      // 右太ももと右足が同じ方向を向いていない
      return false;
    }
    if (
      bottomPoseRightThighAngleZX - bottomPoseRightFootAngleZX <=
      -acceptableError * Math.abs(bottomPoseRightFootAngleZX)
    ) {
      // 右太ももと右足が同じ方向を向いていない
      return false;
    }

    return true;
  },
};

// 背中が反っていない
// とりあえず，topとbottomだけで実装する．（今後，前後のフレームを追加する可能性あり）
const backBent: FormInstructionItem = {
  text: 'Back bent',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    const bottomPose = getBottomPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return true;
    }
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const topPosePelvisNavalAngleYZ = angleInYZ(topPose.worldLandmarks[0], topPose.worldLandmarks[1]);
    const topPoseNavalChestAngleYZ = angleInYZ(topPose.worldLandmarks[1], topPose.worldLandmarks[2]);
    // const topPoseChestNeckAngleYZ = angleInYZ(topPose.landmark[2], topPose.landmark[3]);
    // const topPosePelvisNeckAngleYZ = angleInYZ(topPose.landmark[0], topPose.landmark[3]);
    // const bottomPosePelvisNavalAngleYZ = angleInYZ(bottomPose.landmark[0], bottomPose.landmark[1]);
    // const bottomPoseNavalChestAngleYZ = angleInYZ(bottomPose.landmark[1], bottomPose.landmark[2]);
    // const bottomPoseChestNeckAngleYZ = angleInYZ(bottomPose.landmark[2], bottomPose.landmark[3]);
    // const bottomPosePelvisNeckAngleYZ = angleInYZ(bottomPose.landmark[0], bottomPose.landmark[3]);

    // TODO: acceptableErrorについて検証
    // TODO: 一つずつ書く
    // TODO: 上背部が反っている，曲がっている，下背部が反っている，曲がっているについて4つの関数or返し方を行う
    const acceptableError = 0.1;
    if (
      Math.abs(topPosePelvisNavalAngleYZ - topPoseNavalChestAngleYZ) >=
      acceptableError * Math.abs(topPosePelvisNavalAngleYZ)
    ) {
      return false;
    }

    return true;
  },
};

// bottomでの背中全体の傾き
const backSlant: FormInstructionItem = {
  text: 'Back slant',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const bottomPosePelvisNavalAngleYZ = angleInYZ(bottomPose.worldLandmarks[0], bottomPose.worldLandmarks[1]);
    // const bottomPoseNavalChestAngleYZ = angleInYZ(bottomPose.landmark[1], bottomPose.landmark[2]);
    // const bottomPoseChestNeckAngleYZ = angleInYZ(bottomPose.landmark[2], bottomPose.landmark[3]);
    // const bottomPosePelvisNeckAngleYZ = angleInYZ(bottomPose.landmark[0], bottomPose.landmark[3]);

    // TODO: acceptableErrorについて検証
    // TODO: 一つずつ書く
    // TODO: それぞれの部位で，傾きすぎ，傾かなさすぎを判定する関数or返し方を作成する
    const acceptableError = 0.1;
    if (bottomPosePelvisNavalAngleYZ >= ((1 + acceptableError) * Math.PI * 45) / 180) {
      // 傾きすぎ
      return false;
    }
    if (bottomPosePelvisNavalAngleYZ <= ((1 - acceptableError) * Math.PI * 45) / 180) {
      // 傾かなさすぎ
      return false;
    }

    return true;
  },
};

// つま先の角度
const feetAngle: FormInstructionItem = {
  text: 'Feet angle',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return true;
    }
    // TODO 普遍的な設定を可能にする
    // とりあえず，桂の体で適切なように設定
    const topPoseLeftFootAngleZX = angleInZX(topPose.worldLandmarks[20], topPose.worldLandmarks[21]);
    const topPoseRightFootAngleZX = angleInZX(topPose.worldLandmarks[24], topPose.worldLandmarks[25]);
    const topPoseFeetGapAngleZX = Math.abs(topPoseLeftFootAngleZX + topPoseRightFootAngleZX);

    const test1 = (topPoseLeftFootAngleZX * 180.0) / Math.PI;
    const test2 = (topPoseRightFootAngleZX * 180.0) / Math.PI;
    // console.log('topPoseLeftFootAngleZX', topPoseLeftFootAngleZX);
    // console.log('topPoseRightFootAngleZX', topPoseRightFootAngleZX);
    console.log('topPoseLeftFootAngleZX', test1);
    console.log('topPoseRightFootAngleZX', test2);

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.05;
    // TODO: 桂以外の人でも判定できるようにする
    const numKTR = 0.8;
    const highFeetAngleCheck = ((1 + acceptableError) * Math.PI * 60) / 180 - topPoseFeetGapAngleZX + numKTR;
    const lowFeetAngleCheck = topPoseFeetGapAngleZX - ((1 - acceptableError) * Math.PI * 60) / 180 + numKTR;
    console.log((topPoseFeetGapAngleZX * 180.0) / Math.PI);

    if (highFeetAngleCheck <= 0.0) {
      // つま先の角度が60度を大きく超えている
      console.log('つま先が開きすぎです');
      console.log(highFeetAngleCheck);

      return false;
    }
    if (lowFeetAngleCheck <= 0.0) {
      // つま先の角度が60度を大きく下回っている
      console.log('つま先を外に向けましょう');
      console.log(lowFeetAngleCheck);

      return false;
    }

    return true;
  },
};

// 足のうらがべったり地面につく
// TODO: 角度で比較するか，位置で比較するかを検討
const feetGround: FormInstructionItem = {
  text: 'Feet ground',
  // topとbottomを比較
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    const bottomPose = getBottomPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return true;
    }
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const LeftAnkleMovedDistance = distanceInY(topPose.worldLandmarks[20], bottomPose.worldLandmarks[20]);
    const RightAnkleMovedDistance = distanceInY(topPose.worldLandmarks[24], bottomPose.worldLandmarks[24]);
    const LeftFootMovedDistance = distanceInY(topPose.worldLandmarks[21], bottomPose.worldLandmarks[21]);
    const RightFootMovedDistance = distanceInY(topPose.worldLandmarks[21], bottomPose.worldLandmarks[21]);
    // 判定に使用
    // const topPoseRightFootLength = distanceInXYZ(topPose.worldLandmarks[24], topPose.worldLandmarks[25]);

    // TODO: acceptableErrorについて検証
    // topPoseは足がべったりと地面についていると想定しているが，良いのか
    // const acceptableError = 0.1;
    // TODO: 桂以外でも適応可能なように変更する
    const ankleKTR = 50.0;
    const footKTR = 5.0;
    const LeftAnkleMovedDistanceCheck = ankleKTR + LeftAnkleMovedDistance;
    const RightAnkleMovedDistanceCheck = ankleKTR + RightAnkleMovedDistance;
    const LeftFootMovedDistanceCheck = footKTR + LeftFootMovedDistance;
    const RightFootMovedDistanceCheck = footKTR + RightFootMovedDistance;

    // console.log('topPose.worldLandmarks[20]', topPose.worldLandmarks[20].y);
    // console.log('bottomPose.worldLandmarks[20]', bottomPose.worldLandmarks[20].y);
    // console.log('topPose.worldLandmarks[21]', topPose.worldLandmarks[21].y);
    // console.log('bottomPose.worldLandmarks[21]', bottomPose.worldLandmarks[21].y);

    console.log(LeftAnkleMovedDistanceCheck);
    console.log(RightAnkleMovedDistanceCheck);
    console.log(LeftFootMovedDistanceCheck);
    console.log(RightFootMovedDistanceCheck);

    if (LeftAnkleMovedDistanceCheck <= 0.0) {
      // 左足首の位置が変化した
      console.log('左足首が浮いた');
      console.log(LeftAnkleMovedDistanceCheck);

      // return false;
    }
    if (RightAnkleMovedDistanceCheck <= 0.0) {
      // 右足首の位置が変化した
      console.log('右足首が浮いた');
      console.log(RightAnkleMovedDistanceCheck);

      // return false;
    }
    if (LeftFootMovedDistanceCheck <= 0.0) {
      // 左足先の位置が変化した
      console.log('左足先が浮いた');
      console.log(LeftFootMovedDistanceCheck);

      // return false;
    }
    if (RightFootMovedDistanceCheck <= 0.0) {
      // 右足先の位置が変化した
      console.log('右足先が浮いた');
      console.log(RightFootMovedDistanceCheck);

      // return false;
    }

    return true;
  },
};

// 視線
// 首と顔から顔の傾きをとっているが，首と両耳の中心でもよいかもしれない
const gazeDirection: FormInstructionItem = {
  text: 'Gaze direction',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const bottomPoseNeckHeadAngleYZ = angleInYZ(bottomPose.worldLandmarks[3], bottomPose.worldLandmarks[26]);
    const bottomPoseEyes = midpointBetween(bottomPose.worldLandmarks[28], bottomPose.worldLandmarks[30]);
    // TODO: 視線の向きが適当かについて検証
    // 顔の向きと視線が直行すると仮定して，視線の先を求めている．顎を引くので，この仮定は成り立たないかもしれない
    const gazeTarget = bottomPoseEyes.y * Math.abs(Math.tan(bottomPoseNeckHeadAngleYZ));
    if (gazeTarget <= 120) {
      // 視線が1.2mより手前を向いている
      return false;
    }
    if (gazeTarget >= 150) {
      // 視線が1.5mより置くを向いている．顎を引き，視線を1.2m~1.5mにする
      return false;
    }

    return true;
  },
};

// スタンス
// 踵の幅と肩幅が同じ
const feetWidth: FormInstructionItem = {
  text: 'Feet width',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return true;
    }
    const topPoseLeftShoulderAnkle = Math.abs(distanceInX(topPose.worldLandmarks[5], topPose.worldLandmarks[20]));
    const topPoseRightShoulderAnkle = Math.abs(distanceInX(topPose.worldLandmarks[12], topPose.worldLandmarks[24]));
    // 判定に使用
    const topPoseShoulder = distanceInXYZ(topPose.worldLandmarks[5], topPose.worldLandmarks[12]);

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.1;
    if (topPoseLeftShoulderAnkle >= acceptableError * topPoseShoulder) {
      // 左肩と左足の相対位置がおかしい
      return false;
    }
    if (topPoseRightShoulderAnkle >= acceptableError * topPoseShoulder) {
      // 右肩と右足の相対位置がおかしい
      return false;
    }

    return true;
  },
};

// バーベルを担ぐ上下の位置（肩甲棘の真下に担げているか）
const barbellPosition: FormInstructionItem = {
  text: 'Barbel position',
  // 手首の中心をバーベルと推定して実行
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return true;
    }
    const topPoseWristCenter = midpointBetween(topPose.worldLandmarks[7], topPose.worldLandmarks[14]);

    // 誤差の許容値を得るために使用
    // TODO 動作中，一定に近い値をとる場所を特定
    const topDistanceRightFoot = distanceInXYZ(topPose.worldLandmarks[24], topPose.worldLandmarks[25]);
    // TODO: acceptableErrorについて検証
    const acceptableErrorUnder = 0.1;
    const acceptableErrorUp = 0.1;
    if (topPoseWristCenter.y <= topPose.worldLandmarks[2].y + topDistanceRightFoot * acceptableErrorUnder) {
      // バーベルが肩甲棘と比べ，下すぎる
      return false;
    }
    if (topPoseWristCenter.y >= topPose.worldLandmarks[2].y + topDistanceRightFoot * acceptableErrorUp) {
      // バーベルが肩甲棘と比べ，上すぎる
      return false;
    }

    return true;
  },
};

// 膝先がつま先から見てどれだけ前方or後方にあるか
const kneePosition: FormInstructionItem = {
  text: 'Knee position',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return true;
    }
    const bottomPoseLeftKneeFootZX = distanceInZX(bottomPose.worldLandmarks[21], bottomPose.worldLandmarks[19]);
    const bottomPoseRightKneeFootZX = distanceInZX(bottomPose.worldLandmarks[25], bottomPose.worldLandmarks[23]);
    const bottomPoseLeftKneeFootDirection = Math.sign(
      distanceInZ(bottomPose.worldLandmarks[21], bottomPose.worldLandmarks[19]),
    );
    const bottomPoseRightKneeFootDirection = Math.sign(
      distanceInZ(bottomPose.worldLandmarks[25], bottomPose.worldLandmarks[23]),
    );

    // TODO: 膝の位置を検討
    // TODO: 許容されるずれについて検討．将来的には骨格から値を得たい
    const acceptableKneeAhead = -10;
    const acceptableKneeBack = 10;
    if (bottomPoseLeftKneeFootZX * bottomPoseLeftKneeFootDirection <= acceptableKneeAhead) {
      // 左膝が前に出すぎ
      return false;
    }
    if (bottomPoseRightKneeFootZX * bottomPoseRightKneeFootDirection <= acceptableKneeAhead) {
      // 右膝が前に出すぎ
      return false;
    }
    if (bottomPoseLeftKneeFootZX * bottomPoseLeftKneeFootDirection >= acceptableKneeBack) {
      // 左膝が後すぎる
      return false;
    }
    if (bottomPoseRightKneeFootZX * bottomPoseRightKneeFootDirection >= acceptableKneeBack) {
      // 左膝が後ろすぎる
      return false;
    }

    return true;
  },
};

// ラックの高さ
// TopとButtomだけでは厳しい

// 指導項目を追加したらここにもかく
export const formInstructionItems: FormInstructionItem[] = [
  barbellOnFootCenter,
  squatDepth,
  kneeOut,
  backBent,
  backSlant,
  feetAngle,
  gazeDirection,
  feetWidth,
  feetGround,
  barbellPosition,
  kneePosition,
];
