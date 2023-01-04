import { Options, Pose as PoseMediapipe, Results } from '@mediapipe/pose';
import '@tensorflow/tfjs-backend-webgl';
import { useCallback, useEffect, useRef, useState } from 'react';
import drawPose from 'src/library/pose-estimation/drawPose';
import Camera from '../../library/camera/Camera';
import { loadPoseEstimator, sendFrameToPoseEstimator } from '../../library/pose-estimation/poseEstimator';

function WorkoutDebug() {
  // 表示設定
  const scale = 0.7;
  const canvasWidth = 480 * scale;
  const canvasHeight = 720 * scale;

  // レストとトレーニングの状態
  // const workoutState = useRef(resetWorkoutState());

  // pose estimation models
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [poseEstimator, setPoseEstimator] = useState<PoseMediapipe>();
  const estimatePose = useCallback(
    async (canvas: HTMLCanvasElement) => sendFrameToPoseEstimator(poseEstimator, canvas),
    [poseEstimator],
  );
  // TODO: 外れ値処理
  const onResults = useCallback((results: Results) => {
    drawPose(poseCanvasRef.current, results, 'limegreen');
  }, []);

  // Activate ML models
  useEffect(() => {
    // Pose Estimator
    const poseOptions: Options = {
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.8,
    };
    setPoseEstimator(loadPoseEstimator(poseOptions, onResults));
  }, [onResults]);

  return (
    <div style={{ position: 'relative' }}>
      <Camera
        onFrame={estimatePose}
        originalSize={{ width: canvasHeight, height: canvasWidth }}
        rotation="left"
        style={{
          zIndex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <canvas
        ref={poseCanvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          zIndex: 2,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

export default WorkoutDebug;
