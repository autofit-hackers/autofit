/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

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
      // TODO: use GPU if available otherwise use CPU
      // processing_mode: KinectAzure.K4ABT_TRACKER_PROCESSING_MODE_CPU,
      processing_mode: KinectAzure.K4ABT_TRACKER_PROCESSING_MODE_GPU_CUDA,
      // gpu_device_id: 1,
    });
    kinect.startListening(onResults);
  }
};

export const stopKinect = (kinect: typeof KinectAzure): void => {
  if (kinect && kinect.open() && kinect.isListening()) {
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
