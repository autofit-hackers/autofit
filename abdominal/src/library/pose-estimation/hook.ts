import { Options, Results, Pose as PoseMediapipe } from '@mediapipe/pose';
import { useCallback, useEffect, useState } from 'react';
import { Pose, rotateWorldLandmarks } from 'src/library/pose-estimation/pose';
import { loadPoseEstimator, sendFrameToPoseEstimator } from 'src/library/pose-estimation/poseEstimator';

export type PoseEstimationConfig = {
  options: Options;
  onResults: (pose: Pose) => void;
};

const usePoseEstimation = ({
  options,
  onResults,
}: PoseEstimationConfig): ((canvas: HTMLCanvasElement) => Promise<void>) => {
  const [poseEstimator, setPoseEstimator] = useState<PoseMediapipe>();
  const estimatePose = useCallback(
    async (canvas: HTMLCanvasElement) => sendFrameToPoseEstimator(poseEstimator, canvas),
    [poseEstimator],
  );
  const onPoseResult = useCallback(
    (results: Results) => {
      if (!('poseLandmarks' in results)) return;
      // TODO: ランドマークの回転を調整する
      const pose: Pose = {
        imageLandmarks: results.poseLandmarks,
        worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
        timestamp: new Date().getTime(),
      };
      // TODO: 外れ値処理
      onResults(pose);
    },
    [onResults],
  );

  // Activate ML models
  useEffect(() => {
    setPoseEstimator(loadPoseEstimator(options, onPoseResult));
  }, [onPoseResult, options]);

  return estimatePose;
};

export default usePoseEstimation;
