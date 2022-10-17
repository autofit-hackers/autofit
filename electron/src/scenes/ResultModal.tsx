import CancelIcon from '@mui/icons-material/Cancel';
import { Grid, IconButton, Paper, Typography } from '@mui/material';
import { useRef } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import { FlatCard } from './ui-components/FlatUI';

export default function ResultModal({
  handleClose,
  instructionName,
}: {
  handleClose: () => void;
  instructionName: 'depth' | 'speed' | 'posture';
}) {
  const videoPlayerRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);

  return (
    <>
      <Paper sx={{ marginBlock: '10vh', marginInline: '10vw', height: '80vh', borderRadius: 2 }}>
        <Grid container sx={{ paddingBlock: '2vh', paddingInline: '0vw', mx: '10' }}>
          <Grid item xs={12} sx={{ paddingBlock: '1.5vh', paddingInline: '5vw' }}>
            <Typography variant="h4" component="h1" align="left" borderBottom={0} fontWeight="bold">
              {instructionName}
            </Typography>
          </Grid>
          {/* 右側 */}
          <Grid item xs={8} sx={{ paddingBlock: 'vh', paddingLeft: '5vw', paddingRight: '1vw' }}>
            <ReactPlayer
              ref={videoPlayerRef}
              url="../../resources/movie/squat-posture.mov"
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
              <Typography
                variant="h5"
                component="h1"
                align="center"
                fontWeight="bold"
                sx={{ backgroundColor: 'gray' }}
                height="100%"
              >
                poseGrid
              </Typography>
            </div>
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ paddingInline: '5vw' }}>
          <FlatCard>
            <Typography variant="h6" component="h1" align="left" fontWeight="bold">
              ちゃんと腰を下げたほうがいいよ。ちゃんと腰を下げたほうがいいよ。ちゃんと腰を下げたほうがいいよ。ちゃんと腰を下げたほうがいいよ。ちゃんと腰を下げたほうがいい。
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
