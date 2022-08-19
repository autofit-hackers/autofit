import { Button } from '@mui/material';
import { CameraAngle, PoseGrid } from '../../utils/poseGrid';

function PoseGridViewer(props: {
  gridDivRef: React.MutableRefObject<HTMLDivElement | null>;
  poseGridRef: React.MutableRefObject<PoseGrid | null>;
  cameraPosition: CameraAngle;
}) {
  const { gridDivRef, poseGridRef, cameraPosition } = props;

  return (
    <div
      className="square-box"
      style={{
        zIndex: 2,
        position: 'relative',
        // TODO: Resolve hardcoded value
        width: '588px',
        height: '665px',
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
          height: '95%',
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
        sx={{ position: 'absolute', top: '0%', textAlign: 'center', zIndex: 2 }}
      >
        Reset Camera Position
      </Button>
    </div>
  );
}

export default PoseGridViewer;
