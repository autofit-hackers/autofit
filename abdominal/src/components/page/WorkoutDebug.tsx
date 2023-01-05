import { Options, Results } from '@mediapipe/pose';
import { Box } from '@mui/material';
import { useCallback, useRef } from 'react';
import { getDefaultWorkoutState, updateWorkoutState } from 'src/core/global-state/workoutState';
import { Pose, rotateWorldLandmarks } from 'src/core/training-data/pose';
import { getDefaultRepCountState, updateRepCountState } from 'src/core/workout-analysis/countReps';
import {
  getDefaultExerciseEstimationState,
  updateExerciseEstimationState,
} from 'src/core/workout-analysis/identifyExercise';
import usePoseEstimation from 'src/library/pose-estimation/hooks';
import Camera from '../../library/camera/Camera';
import drawPose from '../../library/pose-estimation/drawPose';

function WorkoutDebug() {
  // 表示設定
  const scale = 0.7;
  const canvasWidth = 480 * scale;
  const canvasHeight = 720 * scale;

  // ワークアウトの状態。値を描画しないものはuseRefで保持する。
  // REF: https://zenn.dev/so_nishimura/articles/c7ebfade970bcc
  const workoutState = useRef(getDefaultWorkoutState());
  const repCountState = useRef(getDefaultRepCountState());
  const exerciseEstimationState = useRef(getDefaultExerciseEstimationState());

  // pose estimation models
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const poseOptions: Options = {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.3,
    minTrackingConfidence: 0.8,
  };
  const onResults = useCallback((results: Results) => {
    if (!('poseLandmarks' in results)) return;
    const pose: Pose = {
      imageLandmarks: results.poseLandmarks,
      worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
      timestamp: new Date().getTime(),
    };
    // TODO: 外れ値処理
    drawPose(poseCanvasRef.current, pose, 'limegreen');
    exerciseEstimationState.current = updateExerciseEstimationState(exerciseEstimationState.current, pose);
    repCountState.current = updateRepCountState(repCountState.current, pose);

    // 種目が確定した後はワークアウトの状態を更新する
    if (!exerciseEstimationState.current.determined) return;
    workoutState.current = updateWorkoutState(
      workoutState.current,
      repCountState.current,
      exerciseEstimationState.current,
    );
  }, []);
  const estimatePose = usePoseEstimation(poseOptions, onResults);

  return (
    <Box sx={{ position: 'relative' }}>
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
    </Box>
  );
}

export default WorkoutDebug;
