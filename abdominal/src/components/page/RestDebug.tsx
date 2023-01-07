import { Box, Typography } from '@mui/material';
import { useCallback, useRef } from 'react';
import drawBoundingBox from 'src/library/object-detection/drawBoundingBox';
import useObjectDetection from 'src/library/object-detection/hooks';
import { getDefaultSessionState, updateSessionState } from '../../core/global-state/sessionState';
import Camera from '../../library/camera/Camera';
import { DetectionResult } from '../../library/object-detection/detector';

function RestDebug() {
  // 表示設定
  const scale = 1;
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
  const sessionState = useRef(getDefaultSessionState());

  // detection model
  const detectorConfig = {
    modelName: 'yolov5',
    threshold: 0.5,
  };
  const BoxCanvasRef = useRef<HTMLCanvasElement>(null);
  const onResults = useCallback(
    (result: DetectionResult) => {
      updateSessionState(sessionState.current, result, detectorConfig.threshold);
      drawBoundingBox(BoxCanvasRef.current, result, detectorConfig.threshold);
    },
    [detectorConfig.threshold],
  );
  const detectEquipment = useObjectDetection(detectorConfig, onResults);

  return (
    <>
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
      <Typography variant="h3" sx={labelSx}>
        {sessionState.current.isWorkingOut ? 'WORKOUT' : 'REST'}
      </Typography>
      <Typography>Weight: {sessionState.current.totalWeight}kg</Typography>
      <Typography>Plates: {sessionState.current.detectedPlates.map((p) => `${p} `)}</Typography>
    </>
  );
}

export default RestDebug;
