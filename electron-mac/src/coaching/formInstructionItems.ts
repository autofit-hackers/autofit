import { angleInYZ, angleInZX, distanceInYZ, distanceInZ, distanceInZX, midpointBetween } from '../training/pose';
import { getBottomPose, getTopPose, Rep } from '../training/rep';

export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly label?: string;
  readonly text?: string;
  readonly importance?: number;
  readonly evaluate: (rep: Rep) => number;
  readonly showGuideline?: (rep: Rep) => void;
};

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

// スクワットの深さ
const squatDepth: FormInstructionItem = {
  id: 0,
  name: 'Squat depth',
  label: '腰の深さ',
  text: '腰を太ももが平行になるまで落としましょう。痛みが起きる場合はバーベルを軽くしてみましょう。',
  importance: 0.5,
  // bottomで判定
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      return 1.0;
    }
    const bottomPoseKnee = midpointBetween(bottomPose.worldLandmarks[19], bottomPose.worldLandmarks[23]);
    const bottomPosePelvisKneeDistanceYZ = distanceInYZ(bottomPose.worldLandmarks[0], bottomPoseKnee);
    // TODO: 十分に腰が下がっているかを判定可能か?
    // TODO: 桂以外の人でも判定できるようにする
    const upAngleKTR = (Math.PI * 9.0) / 180.0; // 9度は桂が指定
    const downAngleKTR = -(Math.PI * 9.0) / 180.0; // 9度は桂が指定;
    const squatDepthUpCheck =
      bottomPose.worldLandmarks[0].y - bottomPoseKnee.y + Math.sin(upAngleKTR) * bottomPosePelvisKneeDistanceYZ;
    const squatDepthDownCheck =
      -bottomPose.worldLandmarks[0].y + bottomPoseKnee.y - Math.sin(downAngleKTR) * bottomPosePelvisKneeDistanceYZ;

    // TODO: デバック用
    if (squatDepthUpCheck <= 0.0) {
      return 0.0;
    }
    if (squatDepthDownCheck <= 0.0) {
      return 0.0;
    }

    return 1.0;
  },
};

// 真上から見た太ももの角度と踵の角度が等しい
const kneeOut: FormInstructionItem = {
  id: 1,
  name: 'Knee out',
  label: '膝が内側に入る',
  text: '膝が内側に入らないように注意しましょう。どうしても内に入ってしまう場合は足幅を狭くしてみましょう。',
  importance: 0.7,
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
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
  id: 2,
  name: 'Back bent',
  label: '背中の曲がり',
  text: '背中が曲がってしまっており、腰を痛める危険性があります。背中に力をいれ、胸をはりながらしゃがみましょう',
  importance: 0.5,
  // topで判定する
  evaluate: (rep: Rep) => {
    const topPose = getTopPose(rep);
    const bottomPose = getBottomPose(rep);
    if (topPose === undefined) {
      return 1.0;
    }
    if (bottomPose === undefined) {
      return 1.0;
    }
    const topPosePelvisNavalAngleYZ = angleInYZ(topPose.worldLandmarks[0], topPose.worldLandmarks[1]);
    const topPoseNavalChestAngleYZ = angleInYZ(topPose.worldLandmarks[1], topPose.worldLandmarks[2]);

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

// 膝先がつま先から見てどれだけ前方or後方にあるか
const kneePosition: FormInstructionItem = {
  id: 3,
  name: 'Knee position',
  // bottomで判定する
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
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

// 指導項目を追加したらここにもかく
export const formInstructionItemsQWS = [squatDepth, kneeOut, backBent, kneePosition];
export const formInstructionItemsEmpty = [];
