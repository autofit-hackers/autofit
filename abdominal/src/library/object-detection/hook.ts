import { useState, useCallback, useEffect } from 'react';
import { Detector, detectOnFrame, loadDetectionModel, DetectionResult } from 'src/library/object-detection/detector';

type Config = {
  modelName: string;
  threshold: number;
};

const useObjectDetection = (
  config: Config,
  onResults: (result: DetectionResult) => void,
): ((canvas: HTMLCanvasElement) => Promise<void>) => {
  const [detector, setDetector] = useState<Detector>();
  const detectObjects = useCallback(
    (canvas: HTMLCanvasElement) => detectOnFrame(detector, canvas, onResults),
    [detector, onResults],
  );

  // Activate ML models
  useEffect(() => {
    loadDetectionModel(config.modelName, setDetector);
  }, [config.modelName]);

  return detectObjects;
};

export default useObjectDetection;
