import CancelIcon from '@mui/icons-material/Cancel';
import { Grid, IconButton, Paper, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Checkpoint, CheckResult } from '../coaching/formEvaluation';
import { Rep } from '../training_data/rep';
import { DEFAULT_POSE_GRID_CONFIG, PoseGrid } from '../utils/poseGrid';
import { FlatCard } from './ui-components/FlatUI';
import PoseGridViewer from './ui-components/PoseGridViewer';

export default function ResultModal({
  handleClose,
  checkpoint,
  checkResult,
  worstRep,
}: {
  handleClose: () => void;
  checkpoint: Checkpoint;
  checkResult: CheckResult;
  worstRep: Rep;
}) {
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGrid = useRef<PoseGrid | null>(null);

  useEffect(() => {
    if (!poseGrid.current && gridDivRef.current) {
      poseGrid.current = new PoseGrid(gridDivRef.current, {
        ...DEFAULT_POSE_GRID_CONFIG,
        camera: { projectionMode: 'perspective', distance: 150, fov: 75 },
      });
      poseGrid.current.isAutoRotating = false;
      poseGrid.current.setCameraAngle(checkpoint.poseGridCameraAngle);
      poseGrid.current.drawGuideline(worstRep.guidelineSymbolsList[checkpoint.id]);
      poseGrid.current.startLoopPlayback(
        worstRep,
        0,
        worstRep.form.length,
        worstRep.form.slice(-1)[0].timestamp - worstRep.form[0].timestamp,
      );
    }
  });

  return (
    <>
      <Paper sx={{ marginBlock: '10vh', marginInline: '10vw', height: '80vh', borderRadius: 2 }}>
        <Grid container sx={{ paddingBlock: '2vh', paddingInline: '0vw', mx: '10' }}>
          <Grid item xs={12} sx={{ paddingBlock: '1.5vh', paddingInline: '5vw' }}>
            <Typography variant="h4" component="h1" align="left" borderBottom={0} fontWeight="bold">
              {checkpoint.labelJP}
            </Typography>
          </Grid>
          {/* 右側 */}
          <Grid item xs={8} sx={{ paddingBlock: 'vh', paddingLeft: '5vw', paddingRight: '1vw' }}>
            <ReactPlayer
              url={checkpoint.lectureVideoUrl}
              id="RepVideo"
              playing
              loop
              width="100%"
              height="100%"
              style={{
                borderRadius: '24px',
                borderColor: '#4AC0E3',
                borderWidth: '6px',
                backgroundColor: 'rgba(0, 0, 0, 1.0)',
              }}
            />
          </Grid>
          {/* 左 */}
          <Grid item xs={4} sx={{ paddingBlock: 'vh', paddingRight: '5vw' }}>
            <div style={{ height: '50vh' }}>
              <PoseGridViewer
                gridDivRef={gridDivRef}
                poseGrid={poseGrid}
                cameraPosition={checkpoint.poseGridCameraAngle}
              />
            </div>
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ paddingInline: '5vw' }}>
          <FlatCard>
            <Typography variant="h5" component="h1" align="left" fontWeight="bold">
              {checkResult.description}
            </Typography>
          </FlatCard>
        </Grid>
      </Paper>
      <IconButton sx={{ position: 'absolute', top: '10vh', right: '10vw' }} color="primary" onClick={handleClose}>
        <CancelIcon sx={{ fontSize: '4vw' }} />
      </IconButton>
    </>
  );
}
