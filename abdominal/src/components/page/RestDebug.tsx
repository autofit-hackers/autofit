import { Box, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Loader from 'src/components/ui/Loader';
import drawBoundingBox from 'src/library/object-detection/drawBoundingBox';
import { resetSessionState, updateSessionState } from '../../core/global-state/sessionState';
import Camera from '../../library/camera/Camera';
import { DetectionResult, detectOnFrame, Detector, loadDetectionModel } from '../../library/object-detection/detector';

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
  const sessionState = useRef(resetSessionState());

  // detection model
  const threshold = 0.5;
  const [isLoadingDetectionModel, setIsLoadingDetectionModel] = useState({ loading: true, progress: 0 });
  const BoxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<Detector>();
  const onResults = useCallback((result: DetectionResult) => {
    updateSessionState(sessionState.current, result, threshold);
    drawBoundingBox(BoxCanvasRef.current, result, threshold);
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
        {sessionState.current.isWorkingOut ? 'WORKOUT' : 'REST'}
      </Typography>
      <Typography>Weight: {sessionState.current.totalWeight}kg</Typography>
      <Typography>Reps: </Typography>
      <Typography>Plates: {sessionState.current.detectedPlates.map((p) => `${p} `)}</Typography>
    </>
  );
}

export default RestDebug;
