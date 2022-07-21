import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList, Results } from '@mediapipe/pose';

class Pose {
  // REF: landmarkの定義はこちら（https://docs.microsoft.com/ja-jp/azure/kinect-dk/body-joints）
  landmark: NormalizedLandmarkList;
  worldLandmark: LandmarkList;

  constructor(result: Results) {
    this.landmark = result.poseLandmarks;
    this.worldLandmark = result.poseWorldLandmarks;
  }

  /*
   * 画像サイズを基準とした[0,1]スケールのメソッド
   */
  kneeCenter = (): NormalizedLandmark => ({
    x: (this.landmark[19].x + this.landmark[23].x) / 2,
    y: (this.landmark[19].y + this.landmark[23].y) / 2,
    z: (this.landmark[19].z + this.landmark[23].z) / 2,
  });

  ankleCenter = (): NormalizedLandmark => ({
    x: (this.landmark[20].x + this.landmark[24].x) / 2,
    y: (this.landmark[20].y + this.landmark[24].y) / 2,
    z: (this.landmark[20].z + this.landmark[24].z) / 2,
  });

  footCenter = (): NormalizedLandmark => ({
    x: (this.landmark[21].x + this.landmark[25].x) / 2,
    y: (this.landmark[21].y + this.landmark[25].y) / 2,
    z: (this.landmark[21].z + this.landmark[25].z) / 2,
  });

  handsDistance = (): number => {
    const handLeft = this.landmark[8];
    const handRight = this.landmark[15];

    return Math.sqrt((handLeft.x - handRight.x) ** 2 + (handLeft.y - handRight.y) ** 2);
  };

  kneesDistance = (): number => {
    const kneeLeft = this.landmark[19];
    const kneeRight = this.landmark[23];

    return Math.sqrt((kneeLeft.x - kneeRight.x) ** 2 + (kneeLeft.y - kneeRight.y) ** 2);
  };

  height = (): number => {
    // TODO: デバッグ用に目と肩のラインで代替しているので、プロダクションではコメントアウトされている処理に戻す
    // const neck = this.landmark[3];
    // const ankle = ankleCenter();
    // return Math.sqrt((neck.x - ankle.x) ** 2 + (neck.y - ankle.y) ** 2);

    const neck = this.landmark[3];
    const nose = this.landmark[27];

    return Math.sqrt((neck.x - nose.x) ** 2 + (neck.y - nose.y) ** 2);
  };

  /*
   * 実世界を基準としたcm単位のメソッド
   */
  kneeCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[19].x + this.worldLandmark[23].x) / 2,
    y: (this.worldLandmark[19].y + this.worldLandmark[23].y) / 2,
    z: (this.worldLandmark[19].z + this.worldLandmark[23].z) / 2,
  });

  ankleCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[20].x + this.worldLandmark[24].x) / 2,
    y: (this.worldLandmark[20].y + this.worldLandmark[24].y) / 2,
    z: (this.worldLandmark[20].z + this.worldLandmark[24].z) / 2,
  });

  footCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[21].x + this.worldLandmark[25].x) / 2,
    y: (this.worldLandmark[21].y + this.worldLandmark[25].y) / 2,
    z: (this.worldLandmark[21].z + this.worldLandmark[25].z) / 2,
  });

  handsDistanceWorld = (): number => {
    const handLeftWorld = this.worldLandmark[8];
    const handRightWorld = this.worldLandmark[15];

    return Math.sqrt((handLeftWorld.x - handRightWorld.x) ** 2 + (handLeftWorld.y - handRightWorld.y) ** 2);
  };

  kneesDistanceWorld = (): number => {
    const kneeLeftWorld = this.worldLandmark[19];
    const kneeRightWorld = this.worldLandmark[23];

    return Math.sqrt((kneeLeftWorld.x - kneeRightWorld.x) ** 2 + (kneeLeftWorld.y - kneeRightWorld.y) ** 2);
  };

  heightWorld = (): number => {
    // TODO: デバッグ用に目と肩のラインで代替しているので、プロダクションではコメントアウトされている処理に戻す
    // const neck = this.landmark[3];
    // const ankle = ankleCenter();
    // return Math.sqrt((neck.x - ankle.x) ** 2 + (neck.y - ankle.y) ** 2);

    const neckWorld = this.worldLandmark[3];
    const noseWorld = this.worldLandmark[27];

    return Math.sqrt((neckWorld.x - noseWorld.x) ** 2 + (neckWorld.y - noseWorld.y) ** 2);
  };
}

export default Pose;
