import CancelIcon from '@mui/icons-material/Cancel';
import { Grid, IconButton, Paper, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import { Checkpoint, CheckResult } from '../coaching/formEvaluation';
import FlatCard from '../stories/FlatCard';
import { Set } from '../training_data/set';

export default function ResultModal({
  handleClose,
  checkpoint,
  checkResult,
  setRecord,
}: {
  handleClose: () => void;
  checkpoint: Checkpoint;
  checkResult: CheckResult;
  setRecord: Set;
}) {
  return (
    <>
      <Paper sx={{ marginBlock: '10vh', marginInline: '10vw', height: '80vh', borderRadius: 2 }}>
        <Grid container sx={{ paddingBlock: '2vh', paddingInline: '0vw', mx: '10' }}>
          <Grid item xs={12} sx={{ paddingBlock: '2vh', paddingInline: '5vw' }}>
            <Typography variant="h4" component="h1" align="left" borderBottom="1vh" fontWeight="bold">
              {checkpoint.nameJP}
            </Typography>
          </Grid>
          {/* 左 */}
          <Grid item xs={6} sx={{ paddingBlock: 'vh', paddingLeft: '5vw', paddingRight: '1vw' }}>
            <ReactPlayer
              url={checkpoint.lectureVideoUrl}
              id="LectureVideo"
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
          {/* 右 */}
          <Grid item xs={6} sx={{ paddingBlock: 'vh', paddingRight: '5vw' }}>
            <ReactPlayer
              url={checkpoint.RGBcameraAngle === 'front' ? setRecord.frontVideoUrl : setRecord.sideVideoUrl}
              id="RecordVideo"
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
