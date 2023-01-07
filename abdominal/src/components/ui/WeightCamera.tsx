import { Box } from '@mui/material';
import { CSSProperties, useRef } from 'react';
import { SessionState } from 'src/core/global-state/sessionState';
import useSessionMonitor from 'src/core/hooks';
import Camera, { CameraProps } from 'src/library/camera/Camera';

type Props = CameraProps & { style?: CSSProperties } & { sessionState: SessionState };

function WeightCamera(props: Props) {
  const { rotation, originalSize, recordingConfig, style, sessionState } = props;
  const { width: originalWidth, height: originalHeight } = originalSize;
  const boxSx = { ...style, position: 'relative' };

  const boundingBoxCanvasRef = useRef<HTMLCanvasElement>(null);
  const monitorSessionState = useSessionMonitor(sessionState, boundingBoxCanvasRef);

  return (
    <Box sx={boxSx}>
      <Camera
        onFrame={monitorSessionState}
        originalSize={{ width: originalWidth, height: originalHeight }}
        rotation={rotation}
        recordingConfig={recordingConfig}
        style={{
          zIndex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <canvas
        ref={boundingBoxCanvasRef}
        width={rotation === undefined || rotation === 'v-flip' ? originalWidth : originalHeight}
        height={rotation === undefined || rotation === 'v-flip' ? originalHeight : originalWidth}
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

WeightCamera.defaultProps = {
  style: {},
};

export default WeightCamera;
