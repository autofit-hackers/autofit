/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

const startKinect = (
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
  const kinect = new KinectAzure();
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
    });
    kinect.startListening(onResults);
  }
};

export default startKinect;
