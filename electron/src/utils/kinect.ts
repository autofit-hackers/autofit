/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { KJ } from '../training_data/pose';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export const startKinect = (
  kinect: typeof KinectAzure,
  onResults: (data: {
    colorImageFrame: {
      imageData: ImageData;
      width: number;
      height: number;
    };
    bodyFrame: {
      bodies: any[];
    };
  }) => void,
) => {
  if (kinect.open()) {
    /*
     * KinectAzureの初期設定
     */
    kinect.startCameras({
      depth_mode: KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED,
      color_format: KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32,
      color_resolution: KinectAzure.K4A_COLOR_RESOLUTION_720P,
    });
    kinect.createTracker({
      // use GPU if available otherwise use CPU
      processing_mode: KinectAzure.K4ABT_TRACKER_PROCESSING_MODE_GPU_CUDA,
      // processing_mode: KinectAzure.K4ABT_TRACKER_PROCESSING_MODE_CPU,
      // gpu_device_id: 1,
    });
    kinect.startListening(onResults);
  }
};

export const stopKinect = (kinect: typeof KinectAzure): void => {
  if (kinect) {
    console.log('closing the kinect');
    kinect
      .stopListening()
      .then(() => {
        console.log('kinect stopped listening');
      })
      .catch((e: any) => {
        console.error(e);
      })
      .then(() => {
        kinect.destroyTracker();
        kinect.stopCameras();
        kinect.close();
        console.log('kinect closed');
      });
  } else {
    console.log('no kinect exposed');
  }
};

export type KinectBody = { skeleton: any; id: number };

export const getInterestBody = (bodies: any[], interestBodyId: number): KinectBody => {
  const getHorizontalDistance = (body: any) =>
    body.skeleton.joints[KJ.PELVIS].cameraX ** 2 + body.skeleton.joints[KJ.PELVIS].cameraZ ** 2;

  // 前回のフレームで人体を検出していない場合
  if (interestBodyId === -1) {
    // 一人しか映ってない場合はそのまま返す
    if (bodies.length === 1) {
      return { skeleton: bodies[0], id: 0 };
    }

    // 一人以上映っている場合は、カメラからのxz距離が一番近い人を返す
    const minHorizontalDistanceFromCamera = bodies.reduce((a: any, b: any) =>
      Math.min(Math.sqrt(getHorizontalDistance(a)), Math.sqrt(getHorizontalDistance(b))),
    );

    const interestBody = bodies.find(
      (a: any) => Math.sqrt(getHorizontalDistance(a)) === minHorizontalDistanceFromCamera,
    );

    return { skeleton: interestBody.skeleton, id: interestBody.id };
  }

  // 前回のフレームで人体が検出されbodyIdが特定されている場合は、そのIDの人を返す
  return { skeleton: bodies[interestBodyId].skeleton, id: interestBodyId };
};
