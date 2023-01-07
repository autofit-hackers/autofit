import { Box } from '@mui/material';
import { CSSProperties, useRef } from 'react';
import { WorkoutState } from 'src/core/global-state/workoutState';
import useWorkoutAnalysis from 'src/core/hook';
import Camera, { CameraProps } from 'src/library/camera/Camera';

type Props = CameraProps & { style?: CSSProperties } & { workoutState: WorkoutState };

function MainCamera(props: Props) {
  const { rotation, originalSize, recordingConfig, style, workoutState } = props;
  const { width: originalWidth, height: originalHeight } = originalSize;
  const boxSx = { ...style, position: 'relative' };

  // pose estimation models
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyzeWorkout = useWorkoutAnalysis(workoutState, poseCanvasRef);

  return (
    <Box sx={boxSx}>
      <Camera
        onFrame={analyzeWorkout}
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
        ref={poseCanvasRef}
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

MainCamera.defaultProps = {
  style: {},
};

export default MainCamera;
