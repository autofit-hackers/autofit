import { Options, Results } from '@mediapipe/pose';
import { useCallback, RefObject, useRef } from 'react';
import { updateWorkoutState, WorkoutState } from 'src/core/global-state/workoutState';
import { Pose, rotateWorldLandmarks } from 'src/core/training-data/pose';
import { updateRepCountState, getDefaultRepCountState } from 'src/core/workout-analysis/countReps';
import { updateExerciseEstimationState } from 'src/core/workout-analysis/identifyExercise';
import drawPose from 'src/library/pose-estimation/drawPose';
import usePoseEstimation from 'src/library/pose-estimation/hook';
import { getDefaultExerciseEstimationState } from './workout-analysis/identifyExercise';

const useWorkoutAnalysis = (
  workoutState: WorkoutState,
  canvasRef: RefObject<HTMLCanvasElement>,
): ((canvas: HTMLCanvasElement) => Promise<void>) => {
  const exerciseEstimationState = useRef(getDefaultExerciseEstimationState());
  const repCountState = useRef(getDefaultRepCountState());

  // pose estimation model
  const options: Options = {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: false,
    minDetectionConfidence: 0.3,
    minTrackingConfidence: 0.8,
  };
  const onResults = useCallback(
    (results: Results) => {
      if (!('poseLandmarks' in results)) return;
      const pose: Pose = {
        imageLandmarks: results.poseLandmarks,
        worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
        timestamp: new Date().getTime(),
      };
      // TODO: 外れ値処理
      drawPose(canvasRef.current, pose, 'limegreen');
      exerciseEstimationState.current = updateExerciseEstimationState(exerciseEstimationState.current, pose);
      repCountState.current = updateRepCountState(repCountState.current, pose);

      // 種目が確定した後はワークアウトの状態を更新する
      if (!exerciseEstimationState.current.determined) return;
      updateWorkoutState(workoutState, repCountState.current, exerciseEstimationState.current);
    },
    [canvasRef, workoutState],
  );

  const estimatePose = usePoseEstimation({ options, onResults });

  return estimatePose;
};

export default useWorkoutAnalysis;
