import CancelIcon from '@mui/icons-material/Cancel';
import { Grid, IconButton, Modal, Paper, Typography } from '@mui/material';
import ReactPlayer from 'react-player';
import FlatCard from './FlatCard';

interface ResultDetailProps {
  checkpointName: string;
  description: string;
  open: boolean;
  // eslint-disable-next-line react/require-default-props
  handleClose?: () => void;
}

export default function ResultDetail({ checkpointName, description, open, handleClose }: ResultDetailProps) {
  return (
    <Modal open={open} onClose={handleClose}>
      <>
        <Paper sx={{ marginBlock: '10vh', marginInline: '10vw', height: '80vh', borderRadius: 2 }}>
          <Grid container sx={{ paddingBlock: '2vh', paddingInline: '0vw', mx: '10' }}>
            <Grid item xs={12} sx={{ paddingBlock: '2vh', paddingInline: '5vw' }}>
              <Typography variant="h4" component="h1" align="left" borderBottom="1vh" fontWeight="bold">
                {checkpointName}
              </Typography>
            </Grid>
            {/* 右側 */}
            <Grid item xs={6} sx={{ paddingBlock: 'vh', paddingLeft: '5vw', paddingRight: '1vw', height: '50vh' }}>
              <ReactPlayer
                url="https://www.youtube.com/watch?v=Q8TXgCzxEnw"
                id="RepVideo"
                playing
                loop
                muted
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
            <Grid item xs={6} sx={{ paddingBlock: 'vh', paddingRight: '5vw' }}>
              <ReactPlayer
                url="https://www.youtube.com/watch?v=Q8TXgCzxEnw"
                id="RepVideo"
                playing
                loop
                muted
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
                {description}
              </Typography>
            </FlatCard>
          </Grid>
        </Paper>
        <IconButton sx={{ position: 'absolute', top: '10vh', right: '10vw' }} color="primary" onClick={handleClose}>
          <CancelIcon sx={{ fontSize: '4vw' }} />
        </IconButton>
      </>
    </Modal>
  );
}
