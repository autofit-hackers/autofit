import { Button } from '@mui/material';
import { CameraPosition, PoseGrid } from '../../utils/poseGrid';

function PoseGridViewer(props: {
  gridDivRef: React.MutableRefObject<HTMLDivElement | null>;
  poseGridRef: React.MutableRefObject<PoseGrid | null>;
  cameraPosition: CameraPosition;
}) {
  const { gridDivRef, poseGridRef, cameraPosition } = props;

  return (
    <>
      <div
        className="pose-grid-container"
        ref={gridDivRef}
        style={{
          position: 'relative',
          textAlign: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          height: '90%',
          width: '100%',
        }}
      />
      <Button
        onClick={() => {
          if (poseGridRef.current !== null) {
            poseGridRef.current.setCameraPosition(cameraPosition);
          }
        }}
        variant="contained"
        sx={{ textAlign: 'center' }}
      >
        Reset Camera Position
      </Button>
    </>
  );
}

export default PoseGridViewer;
