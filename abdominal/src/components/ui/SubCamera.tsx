import { Box } from '@mui/material';
import { CSSProperties } from 'react';
import Camera, { CameraProps } from 'src/library/camera/Camera';

type Props = CameraProps & { style?: CSSProperties };

function SubCamera(props: Props) {
  const { rotation, originalSize, recordingConfig, style } = props;
  const { width: originalWidth, height: originalHeight } = originalSize;

  return (
    <Box sx={style}>
      <Camera
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
    </Box>
  );
}

SubCamera.defaultProps = {
  style: {},
};

export default SubCamera;
