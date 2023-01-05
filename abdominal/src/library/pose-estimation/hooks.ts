import { Options, Results, Pose as PoseMediapipe } from '@mediapipe/pose';
import { useCallback, useEffect, useState } from 'react';
import { loadPoseEstimator, sendFrameToPoseEstimator } from 'src/library/pose-estimation/poseEstimator';

const usePoseEstimator = (
  options: Options,
  onResults: (results: Results) => void,
): ((canvas: HTMLCanvasElement) => Promise<void>) => {
  const [poseEstimator, setPoseEstimator] = useState<PoseMediapipe>();
  const estimatePose = useCallback(
    async (canvas: HTMLCanvasElement) => sendFrameToPoseEstimator(poseEstimator, canvas),
    [poseEstimator],
  );

  // Activate ML models
  useEffect(() => {
    setPoseEstimator(loadPoseEstimator(options, onResults));
  }, [onResults, options]);

  return estimatePose;
};

export default usePoseEstimator;
