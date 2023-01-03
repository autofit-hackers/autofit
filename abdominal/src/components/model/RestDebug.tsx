import { Box, Typography } from '@mui/material';
import '@tensorflow/tfjs-backend-webgl';
import { useCallback, useEffect, useRef, useState } from 'react';
import Camera from '../../library/camera/Camera';
import {
  DetectionResult,
  detectOnFrame,
  Detector,
  drawBoundingBoxes,
  loadDetectionModel,
} from '../../library/ml-models/object-detection/detector';
import Loader from '../../library/ml-models/object-detection/loader';
import { resetMonitorState, updateMonitorState } from '../../library/training/monitorState';

function RestDebug() {
  // 表示設定
  const scale = 0.7;
  const canvasWidth = 480 * scale;
  const canvasHeight = 720 * scale;
  const labelSx = {
    position: 'fixed',
    right: '5vw',
    bottom: '43vh',
    border: 3,
    paddingBlock: 1.5,
    paddingInline: 4,
    borderRadius: 3,
  };

  // レストとトレーニングの状態
  const monitorState = useRef(resetMonitorState());

  // detection model
  const threshold = 0.5;
  const [isLoadingDetectionModel, setIsLoadingDetectionModel] = useState({ loading: true, progress: 0 });
  const BoxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<Detector>();
  const onResults = useCallback((result: DetectionResult) => {
    updateMonitorState(monitorState.current, result, threshold);
    drawBoundingBoxes(BoxCanvasRef.current, result, threshold);
  }, []);
  const detectEquipment = useCallback(
    (canvas: HTMLCanvasElement) => detectOnFrame(detector, canvas, onResults),
    [detector, onResults],
  );

  // Activate ML models
  useEffect(() => {
    const model = loadDetectionModel('yolov5n', setIsLoadingDetectionModel);
    if (model) setDetector(model);
  }, []);

  return (
    <>
      {isLoadingDetectionModel.loading ? (
        <Loader style={{ top: 0, height: '10vh' }}>
          Loading Deep Learning Model... {(isLoadingDetectionModel.progress * 100).toFixed(2)}%
        </Loader>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Camera
            onFrame={detectEquipment}
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
            ref={BoxCanvasRef}
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
      )}
      <Typography variant="h3" sx={labelSx}>
        {monitorState.current.isExercising ? 'WORKOUT' : 'REST'}
      </Typography>
      <Typography>Weight: {monitorState.current.estimatedTotalWeight}kg</Typography>
      <Typography>Reps: </Typography>
      <Typography>Plates: {monitorState.current.detectedPlates.map((p) => `${p} `)}</Typography>
    </>
  );
}

export default RestDebug;
