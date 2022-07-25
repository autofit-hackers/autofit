/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { NormalizedLandmark } from '@mediapipe/pose';
import { useCallback, useEffect, useRef } from 'react';
import { KINECT_POSE_CONNECTIONS, Pose } from './training/pose';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const KinectAzure = require('kinect-azure');

export default function BodyTrack2d() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let outputImageData: ImageData | null = null;

  const renderBGRA32ColorFrame = (ctx: CanvasRenderingContext2D, canvasImageData: ImageData, imageFrame: any) => {
    const newPixelData = Buffer.from(imageFrame.imageData);
    const pixelArray = canvasImageData.data;
    for (let i = 0; i < canvasImageData.data.length; i += 4) {
      pixelArray[i] = newPixelData[i + 2];
      pixelArray[i + 1] = newPixelData[i + 1];
      pixelArray[i + 2] = newPixelData[i];
      pixelArray[i + 3] = 0xff;
    }
    ctx.putImageData(canvasImageData, 0, 0);
  };

  // 毎kinect更新時に回っている関数
  const onResults = useCallback(
    (data: { colorImageFrame: { width: number; height: number }; bodyFrame: { bodies: any[] } }) => {
      if (canvasRef.current === null) {
        throw new Error('canvasRef is null');
      }
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx === null) {
        throw new Error('canvasCtx is null');
      }
      if (outputImageData === null && data.colorImageFrame.width > 0) {
        canvasRef.current.height = data.colorImageFrame.height;
        outputImageData = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
      }
      if (outputImageData !== null) {
        renderBGRA32ColorFrame(canvasCtx, outputImageData, data.colorImageFrame);
        // canvasCtx.putImageData(outputImageData, 0, 0);
      }
      if (data.bodyFrame.bodies.length > 0) {
        // render the skeleton joints on top of the depth feed
        // eslint-disable-next-line no-console
        console.log(data);
        canvasCtx.save();
        data.bodyFrame.bodies.forEach((body) => {
          const landmarks: NormalizedLandmark[] = [];
          const worldLandmarks: NormalizedLandmark[] = [];
          body.skeleton.joints.forEach(
            (joint: { colorX: number; colorY: number; cameraX: number; cameraY: number; cameraZ: number }) => {
              // TODO: 関数化したいですな
              const cameraJoint = {
                x: joint.colorX / data.colorImageFrame.width,
                y: joint.colorY / data.colorImageFrame.height,
                z: 0,
              } as NormalizedLandmark;
              const worldJoint = { x: joint.cameraX, y: joint.cameraY, z: joint.cameraZ } as NormalizedLandmark;
              landmarks.push(cameraJoint);
              worldLandmarks.push(worldJoint);
            },
          );
          const currentPose: Pose = { landmark: landmarks, worldLandmark: worldLandmarks };
          drawLandmarks(canvasCtx, currentPose.landmark, {
            color: 'white',
            lineWidth: 4,
            radius: 8,
            fillColor: 'lightgreen',
          });
          drawConnectors(canvasCtx, currentPose.landmark, KINECT_POSE_CONNECTIONS, {
            color: 'white',
            lineWidth: 4,
          });
        });
        canvasCtx.restore();
      }
    },
    [],
  );

  useEffect(() => {
    const kinect = new KinectAzure();
    if (kinect.open()) {
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
  }, []);

  // expose the kinect instance to the window object in this demo app to allow the parent window to close it between sessions
  // animate();

  return (
    <canvas
      ref={canvasRef}
      className="output_canvas"
      width="1280"
      height="720"
      style={{
        position: 'absolute',
        marginLeft: 'auto',
        marginRight: 'auto',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 2,
        width: 1280,
        height: 720,
      }}
    />
  );
}
