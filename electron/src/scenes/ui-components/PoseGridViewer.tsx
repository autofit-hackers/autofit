import { Button, Switch } from '@mui/material';
import { useState } from 'react';
import { CameraAngle, PoseGrid } from '../../utils/poseGrid';

function PoseGridViewer(props: {
  gridDivRef: React.MutableRefObject<HTMLDivElement | null>;
  poseGridRef: React.MutableRefObject<PoseGrid | null>;
  cameraPosition: CameraAngle;
}) {
  const { gridDivRef, poseGridRef, cameraPosition } = props;
  const [checked, setChecked] = useState(poseGridRef.current?.config.camera.useOrthographic);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
    poseGridRef.current?.changeCameraType();
  };

  return (
    <div
      className="square-box"
      style={{
        zIndex: 2,
        position: 'relative',
        // TODO: Resolve hardcoded value
        width: '100%',
        height: '528px',
        // FIXME: height はピクセル指定しないと正しく表示されない
      }}
    >
      <div
        className="pose-grid-container"
        ref={gridDivRef}
        style={{
          position: 'absolute',
          zIndex: 1,
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          height: '100%', // TODO: Resolve hardcoded value
          width: '100%',
        }}
      />
      <Button
        onClick={() => {
          if (poseGridRef.current !== null) {
            poseGridRef.current.setCameraAngle(cameraPosition);
          }
        }}
        variant="contained"
        sx={{ position: 'absolute', top: 0, textAlign: 'center', zIndex: 2 }}
      >
        Reset Camera Position
      </Button>
      <Switch
        checked={checked}
        onChange={handleChange}
        inputProps={{ 'aria-label': 'controlled' }}
        sx={{ position: 'absolute', top: 0, right: 0, textAlign: 'center', zIndex: 2 }}
      />
    </div>
  );
}

export default PoseGridViewer;
