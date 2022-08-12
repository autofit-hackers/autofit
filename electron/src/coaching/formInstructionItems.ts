import { CameraPosition } from '../utils/render/poseGrid';
import { angleInYZ, angleInZX, distanceInYZ, distanceInZ, distanceInZX, midpointBetween } from '../training/pose';
import { getBottomPose, getTopPose, Rep } from '../training/rep';

export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly label?: string;
  readonly text: string[]; // index: [0, 1, 2]: errorが{-1以下、-1以上１以下、１以上}の場合の表示テキスト
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly importance?: number;
  readonly gridCameraPosition: CameraPosition;
  readonly evaluate: (rep: Rep) => number;
  readonly showGuideline?: (rep: Rep) => void;
};

// REF: KinectのLandmarkはこちらを参照（https://drive.google.com/file/d/145cSnW2Qtz2CakgxgD6uwodFkh8HIkwW/view?usp=sharing）

// スクワットの深さ
const squatDepth: FormInstructionItem = {
  id: 0,
  name: 'Squat depth',
  label: '腰の深さ',
  text: [
    '腰を太ももが平行になるまで落としましょう。痛みが起きる場合はバーベルを軽くしてみましょう。',
    'ちょうどよい深さで腰を落とせています。この調子。',
    '腰を落としすぎているようです。悪いことではありませんが、一般的なスクワットでは、太ももが水平になるところまで腰を落とせば十分です。',
  ],
  importance: 0.5,
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
  // bottomで判定
  evaluate: (rep: Rep) => {
    const bottomPose = getBottomPose(rep);
    if (bottomPose === undefined) {
      return 1.0;
    }
    const bottomPoseKnee = midpointBetween(bottomPose.worldLandmarks[19], bottomPose.worldLandmarks[23]);
    const bottomPosePelvisKneeDistanceYZ = distanceInYZ(bottomPose.worldLandmarks[0], bottomPoseKnee);
    const upAngleKTR = (Math.PI * 9.0) / 180.0; // 9度は桂が指定
    const downAngleKTR = -(Math.PI * 9.0) / 180.0; // 9度は桂が指定;
    const squatDepthUpCheck =
      bottomPose.worldLandmarks[0].y - bottomPoseKnee.y + Math.sin(upAngleKTR) * bottomPosePelvisKneeDistanceYZ;
    const squatDepthDownCheck =
      -bottomPose.worldLandmarks[0].y + bottomPoseKnee.y - Math.sin(downAngleKTR) * bottomPosePelvisKneeDistanceYZ;

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
  text: [
    '膝が内側に入らないように注意しましょう。',
    'ちょうどいい膝の開き方ですね。',
    '膝を外側に出そうとしすぎているようです。もう少しだけ膝の力を抜いてください。',
  ],
  importance: 0.7,
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
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

    const acceptableError = 0.1;
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
const backBent: FormInstructionItem = {
  id: 2,
  name: 'Back bent',
  label: '背中の曲がり',
  text: [
    '背中が曲がってしまっており、腰を痛める危険性があります。背中に力をいれ、胸をはりながらしゃがみましょう',
    '胴体の姿勢がとても良いです。',
    '少し背中が反っているいるように見えます。背中を板のように真っすぐ保つよう意識するとよいでしょう',
  ],
  importance: 0.5,
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
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
  text: [
    '膝が前に出すぎています。関節を痛める危険性があるため、気を付けましょう',
    'ひざの前後の位置が適切です。',
    '膝をもう少し前に出しましょう。',
  ],
  gridCameraPosition: { theta: 0, phi: 0, distance: 150 },
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
