import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { IconButton, Switch } from '@mui/material';
import { useState } from 'react';
import { CameraAngle, PoseGrid } from '../../utils/poseGrid';

function PoseGridViewer(props: {
  gridDivRef: React.MutableRefObject<HTMLDivElement | null>;
  poseGrid: React.MutableRefObject<PoseGrid | null>;
  cameraPosition: CameraAngle;
}) {
  const { gridDivRef, poseGrid, cameraPosition } = props;
  const [projectionMode, setProjectionMode] = useState<'perspective' | 'parallel'>('parallel');

  const handleCameraTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProjectionMode(event.target.checked ? 'parallel' : 'perspective');
    poseGrid.current?.changeCameraType();
  };

  return (
    <>
      <div
        className="pose-grid-container"
        ref={gridDivRef}
        style={{
          position: 'absolute',
          zIndex: 1,
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          width: '50vh',
          height: '50vh',
        }}
      />
      <IconButton
        aria-label="reset-camera-angle"
        color="primary"
        onClick={() => {
          if (poseGrid.current !== null) {
            poseGrid.current.setCameraAngle(cameraPosition);
          }
        }}
        sx={{ zIndex: 2 }}
      >
        <RotateLeftIcon />
      </IconButton>
      <Switch
        checked={projectionMode === 'parallel'}
        onChange={handleCameraTypeChange}
        inputProps={{ 'aria-label': 'controlled' }}
        sx={{ position: 'absolute', top: 0, right: 0, textAlign: 'center', zIndex: 2 }}
      />
    </>
  );
}

export default PoseGridViewer;
