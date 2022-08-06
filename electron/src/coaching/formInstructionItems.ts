import {
  angleInYZ,
  angleInZX,
  distanceInX,
  distanceInXYZ,
  distanceInY,
  distanceInYZ,
  distanceInZ,
  distanceInZX,
  midpointBetween,
} from '../training/pose';
import { getBottomPose, getTopPose, Rep } from '../training/rep';

export type FormInstructionItem = {
  readonly itemName: string;
  readonly evaluate: (rep: Rep) => number;
  readonly showGuideline?: (rep: Rep) => void;
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly instructionTitle?: string;
  readonly instructionText?: string;
  readonly importance?: number;
};

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

// バーベルは足の中心の真上を移動
const barbellOnFootCenter: FormInstructionItem = {
  itemName: 'Barbel on foot center',
  instructionTitle: 'まんなか',
  instructionText: 'まんなかテスト',
  importance: 0.5,
  evaluate: (rep: Rep) => {
    // 毎フレーム(サンプリングしても良い)
    // TODO: マイフレームごとに書き換えること
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return 1.0;
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

      return 0.0;
    }
    if (
      topPoseWristCenter.x <=
      (topPoseAnkleCenter.x + topPoseFootCenter.x) / 2 - topDistanceRightFoot * acceptableError
    ) {
      // バーベルが右に寄っている
      return 0.0;
    }
    if (
      topPoseWristCenter.z <=
      (topPoseAnkleCenter.z + topPoseFootCenter.z) / 2 - topDistanceRightFoot * acceptableError
    ) {
      // バーベルが前すぎる
      return 0.0;
    }
    if (
      topPoseWristCenter.z >=
      (topPoseAnkleCenter.z + topPoseFootCenter.z) / 2 + topDistanceRightFoot * acceptableError
    ) {
      // バーベルが後ろすぎる
      return 0.0;
    }

    return 1.0;
  },
};

// スクワットの深さ
const squatDepth: FormInstructionItem = {
  itemName: 'Squat depth',
  instructionTitle: '腰の深さ',
  instructionText: '腰を太ももが平行になるまで落としましょう。痛みが起きる場合はバーベルを軽くしてみましょう。',
  importance: 0.5,
  // bottomで判定
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
    }
    const bottomPoseKnee = midpointBetween(bottomPose.worldLandmarks[19], bottomPose.worldLandmarks[23]);
    const bottomPosePelvisKneeDistanceYZ = distanceInYZ(bottomPose.worldLandmarks[0], bottomPoseKnee);
    // const bottomPosePelvisKneeAngleYZ = angleInYZ(bottomPose.worldLandmarks[0], bottomPoseKnee);
    // console.log('bottomPosePelvisKneeYZ: ', bottomPosePelvisKneeYZ);
    // console.log('bottomPosePelvisKneeAngleYZ: ', bottomPosePelvisKneeAngleYZ);
    // TODO: 十分に腰が下がっているかを判定可能か?
    // TODO: 桂以外の人でも判定できるようにする
    const upAngleKTR = (Math.PI * 9.0) / 180.0; // 9度は桂が指定
    const downAngleKTR = -(Math.PI * 9.0) / 180.0; // 9度は桂が指定;
    const squatDepthUpCheck =
      bottomPose.worldLandmarks[0].y - bottomPoseKnee.y + Math.sin(upAngleKTR) * bottomPosePelvisKneeDistanceYZ;
    const squatDepthDownCheck =
      -bottomPose.worldLandmarks[0].y + bottomPoseKnee.y - Math.sin(downAngleKTR) * bottomPosePelvisKneeDistanceYZ;

    // console.log(squatDepthUpCheck);
    // console.log(squatDepthDownCheck);

    // TODO: デバック用
    if (squatDepthUpCheck <= 0.0) {
      console.log('腰の下げ方が足りない');

      return 0.0;
    }
    if (squatDepthDownCheck <= 0.0) {
      console.log('腰を下げすぎ');

      return 0.0;
    }
    console.log('十分に腰を落とした');

    return 1.0;
  },
};

// 真上から見た太ももの角度と踵の角度が等しい
const kneeOut: FormInstructionItem = {
  itemName: 'Knee out',
  instructionTitle: '膝が内側に入る',
  instructionText:
    '膝が内側に入らないように注意しましょう。どうしても内に入ってしまう場合は足幅を狭くしてみましょう。',
  importance: 0.7,
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
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
      return 0.0;
    }
    if (
      bottomPoseLeftThighAngleZX - bottomPoseLeftFootAngleZX <=
      -acceptableError * Math.abs(bottomPoseLeftFootAngleZX)
    ) {
      // 左太ももと左足が同じ方向を向いていない
      return 0.0;
    }
    if (
      bottomPoseRightThighAngleZX - bottomPoseRightFootAngleZX >=
      acceptableError * Math.abs(bottomPoseRightFootAngleZX)
    ) {
      // 右太ももと右足が同じ方向を向いていない
      return 0.0;
    }
    if (
      bottomPoseRightThighAngleZX - bottomPoseRightFootAngleZX <=
      -acceptableError * Math.abs(bottomPoseRightFootAngleZX)
    ) {
      // 右太ももと右足が同じ方向を向いていない
      return 0.0;
    }

    return 1.0;
  },
};

// 背中が反っていない
// とりあえず，topとbottomだけで実装する．（今後，前後のフレームを追加する可能性あり）
const backBent: FormInstructionItem = {
  itemName: 'Back bent',
  instructionTitle: '背中の曲がり',
  instructionText:
    '背中が曲がってしまっており、腰を痛める危険性があります。背中に力をいれ、胸をはりながらしゃがみましょう',
  importance: 0.5,
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    const bottomPose = getBottomPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return 1.0;
    }
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
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
      return 0.0;
    }

    return 1.0;
  },
};

// bottomでの背中全体の傾き
const backSlant: FormInstructionItem = {
  itemName: 'Back slant',
  instructionTitle: '背中の傾き',
  instructionText: '背中の傾きテスト',
  importance: 0.5,
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
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
      return 0.0;
    }
    if (bottomPosePelvisNavalAngleYZ <= ((1 - acceptableError) * Math.PI * 45) / 180) {
      // 傾かなさすぎ
      return 0.0;
    }

    return 1.0;
  },
};

// つま先の角度
const feetAngle: FormInstructionItem = {
  itemName: 'Feet angle',
  instructionTitle: 'つま先の角度',
  instructionText: 'つまさきテスト',
  importance: 0.5,
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return 1.0;
    }
    // TODO 普遍的な設定を可能にする
    // とりあえず，桂の体で適切なように設定
    const topPoseLeftFootAngleZX = angleInZX(topPose.worldLandmarks[20], topPose.worldLandmarks[21]);
    const topPoseRightFootAngleZX = angleInZX(topPose.worldLandmarks[24], topPose.worldLandmarks[25]);
    const topPoseFeetGapAngleZX = Math.abs(topPoseLeftFootAngleZX + topPoseRightFootAngleZX);

    // const test1 = (topPoseLeftFootAngleZX * 180.0) / Math.PI;
    // const test2 = (topPoseRightFootAngleZX * 180.0) / Math.PI;
    // console.log('topPoseLeftFootAngleZX', topPoseLeftFootAngleZX);
    // console.log('topPoseRightFootAngleZX', topPoseRightFootAngleZX);
    // console.log('topPoseLeftFootAngleZX', test1);
    // console.log('topPoseRightFootAngleZX', test2);

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.05;
    // TODO: 桂以外の人でも判定できるようにする
    const numKTR = 0.8;
    const highFeetAngleCheck = ((1 + acceptableError) * Math.PI * 60) / 180 - topPoseFeetGapAngleZX + numKTR;
    const lowFeetAngleCheck = topPoseFeetGapAngleZX - ((1 - acceptableError) * Math.PI * 60) / 180 + numKTR;
    // console.log((topPoseFeetGapAngleZX * 180.0) / Math.PI);

    if (highFeetAngleCheck <= 0.0) {
      // つま先の角度が60度を大きく超えている
      // console.log('つま先が開きすぎです');
      // console.log(highFeetAngleCheck);

      return 0.0;
    }
    if (lowFeetAngleCheck <= 0.0) {
      // つま先の角度が60度を大きく下回っている
      // console.log('つま先を外に向けましょう');
      // console.log(lowFeetAngleCheck);

      return 0.0;
    }

    return 1.0;
  },
};

// 足のうらがべったり地面につく
// TODO: 角度で比較するか，位置で比較するかを検討
const feetGround: FormInstructionItem = {
  itemName: 'Feet ground',
  instructionTitle: 'べったり',
  instructionText: 'べったりテスト',
  importance: 0.5,
  // topとbottomを比較
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    const bottomPose = getBottomPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return 1.0;
    }
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
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

      // return 0.0;
    }
    if (RightAnkleMovedDistanceCheck <= 0.0) {
      // 右足首の位置が変化した
      console.log('右足首が浮いた');
      console.log(RightAnkleMovedDistanceCheck);

      // return 0.0;
    }
    if (LeftFootMovedDistanceCheck <= 0.0) {
      // 左足先の位置が変化した
      console.log('左足先が浮いた');
      console.log(LeftFootMovedDistanceCheck);

      // return 0.0;
    }
    if (RightFootMovedDistanceCheck <= 0.0) {
      // 右足先の位置が変化した
      console.log('右足先が浮いた');
      console.log(RightFootMovedDistanceCheck);

      // return 0.0;
    }

    return 1.0;
  },
};

// 視線
// 首と顔から顔の傾きをとっているが，首と両耳の中心でもよいかもしれない
const gazeDirection: FormInstructionItem = {
  itemName: 'Gaze direction',
  instructionTitle: '視線',
  instructionText: '視線テスト',
  importance: 0.5,
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
    }
    const bottomPoseNeckHeadAngleYZ = angleInYZ(bottomPose.worldLandmarks[3], bottomPose.worldLandmarks[26]);
    const bottomPoseEyes = midpointBetween(bottomPose.worldLandmarks[28], bottomPose.worldLandmarks[30]);
    // TODO: 視線の向きが適当かについて検証
    // 顔の向きと視線が直行すると仮定して，視線の先を求めている．顎を引くので，この仮定は成り立たないかもしれない
    const gazeTarget = bottomPoseEyes.y * Math.abs(Math.tan(bottomPoseNeckHeadAngleYZ));
    if (gazeTarget <= 120) {
      // 視線が1.2mより手前を向いている
      return 0.0;
    }
    if (gazeTarget >= 150) {
      // 視線が1.5mより置くを向いている．顎を引き，視線を1.2m~1.5mにする
      return 0.0;
    }

    return 1.0;
  },
};

// スタンス
// 踵の幅と肩幅が同じ
const feetWidth: FormInstructionItem = {
  itemName: 'Feet width',
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return 1.0;
    }
    const topPoseLeftShoulderAnkle = Math.abs(distanceInX(topPose.worldLandmarks[5], topPose.worldLandmarks[20]));
    const topPoseRightShoulderAnkle = Math.abs(distanceInX(topPose.worldLandmarks[12], topPose.worldLandmarks[24]));
    // 判定に使用
    const topPoseShoulder = distanceInXYZ(topPose.worldLandmarks[5], topPose.worldLandmarks[12]);

    // TODO: acceptableErrorについて検証
    const acceptableError = 0.1;
    if (topPoseLeftShoulderAnkle >= acceptableError * topPoseShoulder) {
      // 左肩と左足の相対位置がおかしい
      return 0.0;
    }
    if (topPoseRightShoulderAnkle >= acceptableError * topPoseShoulder) {
      // 右肩と右足の相対位置がおかしい
      return 0.0;
    }

    return 1.0;
  },
};

// バーベルを担ぐ上下の位置（肩甲棘の真下に担げているか）
const barbellPosition: FormInstructionItem = {
  itemName: 'Barbel position',
  // 手首の中心をバーベルと推定して実行
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    if (topPose === undefined) {
      console.log('topPose is undefined');

      return 1.0;
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
      return 0.0;
    }
    if (topPoseWristCenter.y >= topPose.worldLandmarks[2].y + topDistanceRightFoot * acceptableErrorUp) {
      // バーベルが肩甲棘と比べ，上すぎる
      return 0.0;
    }

    return 1.0;
  },
};

// 膝先がつま先から見てどれだけ前方or後方にあるか
const kneePosition: FormInstructionItem = {
  itemName: 'Knee position',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      console.log('bottomPose is undefined');

      return 1.0;
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
      return 0.0;
    }
    if (bottomPoseRightKneeFootZX * bottomPoseRightKneeFootDirection <= acceptableKneeAhead) {
      // 右膝が前に出すぎ
      return 0.0;
    }
    if (bottomPoseLeftKneeFootZX * bottomPoseLeftKneeFootDirection >= acceptableKneeBack) {
      // 左膝が後すぎる
      return 0.0;
    }
    if (bottomPoseRightKneeFootZX * bottomPoseRightKneeFootDirection >= acceptableKneeBack) {
      // 左膝が後ろすぎる
      return 0.0;
    }

    return 1.0;
  },
};

// ラックの高さ
// TopとBottomだけでは厳しい

// 指導項目を追加したらここにもかく
export const formInstructionItems: { [key: string]: FormInstructionItem } = {
  [barbellOnFootCenter.itemName]: barbellOnFootCenter,
  [squatDepth.itemName]: squatDepth,
  [kneeOut.itemName]: kneeOut,
  [backBent.itemName]: backBent,
  [backSlant.itemName]: backSlant,
  [feetAngle.itemName]: feetAngle,
  [barbellPosition.itemName]: barbellPosition,
  [gazeDirection.itemName]: gazeDirection,
  [feetWidth.itemName]: feetWidth,
  [feetGround.itemName]: feetGround,
  [barbellOnFootCenter.itemName]: barbellOnFootCenter,
  [kneePosition.itemName]: kneePosition,
};
