import { useCallback, RefObject } from 'react';
import { SessionState, updateSessionState } from 'src/core/session-monitor/sessionState';
import { DetectionResult } from 'src/library/object-detection/detector';
import drawBoundingBox from 'src/library/object-detection/drawBoundingBox';
import useObjectDetection from 'src/library/object-detection/hook';

const useSessionMonitor = (
  sessionState: SessionState,
  canvasRef: RefObject<HTMLCanvasElement>,
): ((canvas: HTMLCanvasElement) => Promise<void>) => {
  // detection model
  const detectorConfig = {
    modelName: 'yolov5',
    threshold: 0.5,
  };
  const onResults = useCallback(
    (result: DetectionResult) => {
      updateSessionState(sessionState, result, detectorConfig.threshold);
      drawBoundingBox(canvasRef.current, result, detectorConfig.threshold);
    },
    [canvasRef, detectorConfig.threshold, sessionState],
  );
  const monitorSessionState = useObjectDetection(detectorConfig, onResults);

  return monitorSessionState;
};

export default useSessionMonitor;
