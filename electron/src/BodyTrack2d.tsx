import KinectAzure from 'kinect-azure';
import { useCallback, useRef } from 'react';

export default function BodyTrack2d() {
  const kinect = new KinectAzure();

  const $outputCanvas = useRef<HTMLCanvasElement>(null);
  const outputCtx = $outputCanvas.current.getContext('2d');
  let outputImageData: ImageData;
  let depthModeRange;

  const renderBGRA32ColorFrame = (ctx, canvasImageData, imageFrame) => {
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
  const onResults = useCallback((data) => {
    if (!outputCtx) {
      return;
    }
    if (!outputImageData && data.colorImageFrame.width > 0) {
      $outputCanvas.height = data.colorImageFrame.height;
      outputImageData = outputCtx.createImageData($outputCanvas.width, $outputCanvas.height);
    }
    if (outputImageData) {
      renderBGRA32ColorFrame(outputCtx, outputImageData, data.colorImageFrame);
    }
    if (data.bodyFrame.bodies) {
      // render the skeleton joints on top of the depth feed
      outputCtx.save();
      console.log(data);
      data.bodyFrame.bodies.forEach((body) => {
        outputCtx.fillStyle = 'red';
        outputCtx.strokeStyle = 'white';
        outputCtx.lineWidth = 3;
        body.skeleton.joints.forEach((joint) => {
          outputCtx.beginPath();
          outputCtx.arc(joint.colorX, joint.colorY, 10, 0, 2 * Math.PI, false);
          outputCtx.fill();
          outputCtx.beginPath();
          outputCtx.arc(joint.colorX, joint.colorY, 10, 0, 2 * Math.PI, false);
          outputCtx.stroke();
        });
        // draw the pelvis as a green square
        const pelvis = body.skeleton.joints[KinectAzure.K4ABT_JOINT_PELVIS];
        outputCtx.fillStyle = 'green';
        outputCtx.fillRect(pelvis.colorX, pelvis.colorY, 10, 10);
      });
      outputCtx.restore();
    }
  }, []);

  const startKinect = () => {
    if (kinect.open()) {
      kinect.startCameras({
        depth_mode: KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED,
        color_format: KinectAzure.K4A_IMAGE_FORMAT_COLOR_BGRA32,
        color_resolution: KinectAzure.K4A_COLOR_RESOLUTION_720P,
      });

      depthModeRange = kinect.getDepthModeRange(KinectAzure.K4A_DEPTH_MODE_NFOV_UNBINNED);
      kinect.createTracker({
        processing_mode: KinectAzure.K4ABT_TRACKER_PROCESSING_MODE_GPU_CUDA,
      });

      kinect.startListening(onResults);
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
  };

  // expose the kinect instance to the window object in this demo app to allow the parent window to close it between sessions
  window.kinect = kinect;
  startKinect();
  animate();

  return (
    <>
      <p>aaaaa</p>
      <canvas
        ref={$outputCanvas}
        className="output_canvas"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 2,
          width: 1000,
          height: 1000,
        }}
      />
    </>
  );
}
