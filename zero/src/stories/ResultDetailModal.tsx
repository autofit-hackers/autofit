import CancelIcon from '@mui/icons-material/Cancel';
import { CardMedia, Grid, IconButton, Modal, Paper, Typography } from '@mui/material';
import FlatCard from './FlatCard';

interface ResultDetailModalProps {
  checkpointName: string;
  description: string;
  open: boolean;
  leftVideoUrl: string;
  rightVideoUrl: string;
  // eslint-disable-next-line react/require-default-props
  handleClose?: () => void;
}

export default function ResultDetailModal({
  checkpointName,
  description,
  open,
  leftVideoUrl,
  rightVideoUrl,
  handleClose,
}: ResultDetailModalProps) {
  return (
    <Modal open={open} onClose={handleClose}>
      <>
        <Paper sx={{ marginBlock: '10vh', marginInline: '10vw', height: '80vh', borderRadius: 2 }}>
          <Grid container sx={{ paddingBlock: '2vh', paddingInline: '0vw' }}>
            <Grid item xs={12} sx={{ paddingBlock: '2vh', paddingInline: '5vw' }}>
              <Typography variant="h4" component="h1" align="left" borderBottom="1vh" fontWeight="bold">
                {checkpointName}
              </Typography>
            </Grid>

            {/* 左 */}
            <Grid
              item
              xs={6}
              sx={{
                paddingBlock: 'vh',
                paddingLeft: '5vw',
                paddingRight: '1vw',
                height: '50vh',
              }}
            >
              <CardMedia
                component="video"
                image={leftVideoUrl}
                style={{ height: '100%', objectFit: 'contain' }}
                autoPlay
                loop
                muted
                controls
                sx={{
                  border: 6,
                  borderRadius: 5,
                  borderColor: '#4AC0E3',
                  backgroundColor: 'rgba(0, 0, 0, 1.0)',
                }}
              />
            </Grid>

            {/* 右 */}
            <Grid item xs={6} sx={{ paddingBlock: 'vh', paddingRight: '5vw', height: '50vh' }}>
              <CardMedia
                component="video"
                image={rightVideoUrl}
                style={{ height: '100%', objectFit: 'contain' }}
                autoPlay
                loop
                muted
                controls
                sx={{
                  border: 6,
                  borderRadius: 5,
                  borderColor: '#4AC0E3',
                  backgroundColor: 'rgba(0, 0, 0, 1.0)',
                }}
              />
            </Grid>
          </Grid>

          {/* 下 */}
          <Grid item xs={12} sx={{ paddingLeft: '5vw', paddingRight: '5vw' }}>
            <FlatCard>
              <Typography variant="h5" component="h1" align="left" fontWeight="bold">
                {description}
              </Typography>
            </FlatCard>
          </Grid>
        </Paper>

        {/* 右上のボタン */}
        <IconButton sx={{ position: 'absolute', top: '10vh', right: '10vw' }} color="primary" onClick={handleClose}>
          <CancelIcon sx={{ fontSize: '4vw' }} />
        </IconButton>
      </>
    </Modal>
  );
}
