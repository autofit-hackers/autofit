import { Landmark, LandmarkList, NormalizedLandmark, NormalizedLandmarkList, Results } from '@mediapipe/pose';

class Pose {
  landmark: NormalizedLandmarkList;
  worldLandmark: LandmarkList;

  constructor(result: Results) {
    this.landmark = result.poseLandmarks;
    this.worldLandmark = result.poseWorldLandmarks;
  }

  /*
   * 画像サイズを基準とした[0,1]スケールのメソッド
   */
  neckCenter = (): NormalizedLandmark => ({
    x: (this.landmark[11].x + this.landmark[12].x) / 2,
    y: (this.landmark[11].y + this.landmark[12].y) / 2,
    z: (this.landmark[11].z + this.landmark[12].z) / 2,
  });

  hipCenter = (): NormalizedLandmark => ({
    x: (this.landmark[23].x + this.landmark[24].x) / 2,
    y: (this.landmark[23].y + this.landmark[24].y) / 2,
    z: (this.landmark[23].z + this.landmark[24].z) / 2,
  });

  kneeCenter = (): NormalizedLandmark => ({
    x: (this.landmark[25].x + this.landmark[26].x) / 2,
    y: (this.landmark[25].y + this.landmark[26].y) / 2,
    z: (this.landmark[25].z + this.landmark[26].z) / 2,
  });

  footCenter = (): NormalizedLandmark => ({
    x: (this.landmark[27].x + this.landmark[28].x) / 2,
    y: (this.landmark[27].y + this.landmark[28].y) / 2,
    z: (this.landmark[27].z + this.landmark[28].z) / 2,
  });

  kneesDistance = (): number => {
    const kneeLeft = this.landmark[25];
    const kneeRight = this.landmark[26];

    return Math.sqrt((kneeLeft.x - kneeRight.x) ** 2 + (kneeLeft.y - kneeRight.y) ** 2);
  };

  handsDistance = (): number => {
    const handLeft = this.landmark[15];
    const handRight = this.landmark[16];

    return Math.sqrt((handLeft.x - handRight.x) ** 2 + (handLeft.y - handRight.y) ** 2);
  };

  height = (): number => {
    // TODO: デバッグ用に目と肩のラインで代替しているので、プロダクションではコメントアウトされている処理に戻す
    // const neck = this.neckCenter();
    // const foot = this.footCenter();

    // return Math.sqrt((neck.x - foot.x) ** 2 + (neck.y - foot.y) ** 2);
    const neck = this.neckCenter();
    const nose = this.landmark[0];

    return Math.sqrt((neck.x - nose.x) ** 2 + (neck.y - nose.y) ** 2);
  };

  /*
   * 実世界を基準としたcm単位のメソッド
   */
  neckCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[11].x + this.worldLandmark[12].x) / 2,
    y: (this.worldLandmark[11].y + this.worldLandmark[12].y) / 2,
    z: (this.worldLandmark[11].z + this.worldLandmark[12].z) / 2,
  });

  hipCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[23].x + this.worldLandmark[24].x) / 2,
    y: (this.worldLandmark[23].y + this.worldLandmark[24].y) / 2,
    z: (this.worldLandmark[23].z + this.worldLandmark[24].z) / 2,
  });

  kneeCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[25].x + this.worldLandmark[26].x) / 2,
    y: (this.worldLandmark[25].y + this.worldLandmark[26].y) / 2,
    z: (this.worldLandmark[25].z + this.worldLandmark[26].z) / 2,
  });

  footCenterWorld = (): Landmark => ({
    x: (this.worldLandmark[27].x + this.worldLandmark[28].x) / 2,
    y: (this.worldLandmark[27].y + this.worldLandmark[28].y) / 2,
    z: (this.worldLandmark[27].z + this.worldLandmark[28].z) / 2,
  });

  kneesDistanceWorld = (): number => {
    const kneeLeftWorld = this.worldLandmark[25];
    const kneeRightWorld = this.worldLandmark[26];

    return Math.sqrt((kneeLeftWorld.x - kneeRightWorld.x) ** 2 + (kneeLeftWorld.y - kneeRightWorld.y) ** 2);
  };

  handsDistanceWorld = (): number => {
    const handLeftWorld = this.worldLandmark[15];
    const handRightWorld = this.worldLandmark[16];

    return Math.sqrt((handLeftWorld.x - handRightWorld.x) ** 2 + (handLeftWorld.y - handRightWorld.y) ** 2);
  };

  heightWorld = (): number => {
    // TODO: デバッグ用に目と肩のラインで代替しているので、プロダクションではコメントアウトされている処理に戻す
    // const neckWorld = this.neckCenterWorld();
    // const footWorld = this.footCenterWorld();

    // return Math.sqrt((neckWorld.x - footWorld.x) ** 2 + (neckWorld.y - footWorld.y) ** 2);
    const neckWorld = this.neckCenterWorld();
    const noseWorld = this.worldLandmark[0];

    return Math.sqrt((neckWorld.x - noseWorld.x) ** 2 + (neckWorld.y - noseWorld.y) ** 2);
  };
}

export default Pose;
