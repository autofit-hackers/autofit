import { Options, Pose as PoseMediapipe, Results } from '@mediapipe/pose';
import '@tensorflow/tfjs-backend-webgl';
import { useCallback, useEffect, useRef, useState } from 'react';
import drawPose from 'src/library/ml-models/pose-estimation/drawPose';
import Camera from '../../library/camera/Camera';
import { loadPoseEstimator, sendFrameToPoseEstimator } from '../../library/ml-models/pose-estimation/poseEstimator';
import { Pose, rotateWorldLandmarks } from '../../library/training/pose';
import { resetTrainingState, updateTrainingState } from '../../library/training/trainingState';

function TrainingDebug() {
  // 表示設定
  const scale = 0.7;
  const canvasWidth = 480 * scale;
  const canvasHeight = 720 * scale;

  // レストとトレーニングの状態
  const trainingState = useRef(resetTrainingState());

  // pose estimation models
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const [poseEstimator, setPoseEstimator] = useState<PoseMediapipe>();
  const estimatePose = useCallback(
    async (canvas: HTMLCanvasElement) => sendFrameToPoseEstimator(poseEstimator, canvas),
    [poseEstimator],
  );
  // TODO: 外れ値処理
  const onPoseEstimation = useCallback((results: Results) => {
    if ('poseLandmarks' in results) {
      // mediapipeの推論結果を自作のPoseクラスに代入
      const pose: Pose = {
        landmarks: results.poseLandmarks,
        worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
        timestamp: new Date().getTime(),
      };

      // フォームを分析し、レップの状態を更新する
      trainingState.current = updateTrainingState(trainingState.current, pose);
    }
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
    setPoseEstimator(loadPoseEstimator(poseOptions, onPoseEstimation));
  }, [onPoseEstimation]);

  return (
    <div style={{ position: 'relative' }}>
      <Camera
        onFrame={estimatePose}
        inputWidth={canvasHeight}
        inputHeight={canvasWidth}
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

export default TrainingDebug;
