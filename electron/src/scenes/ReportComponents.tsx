import { Grid, Paper, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import ReactPlayer from 'react-player';
import RestTimer from '../ui_component/RestTimer';
import { repVideoUrlsAtom } from './atoms';

export function TrainingStats(props: { text: string }) {
  const { text } = props;

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '20vh',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          お疲れ様でした！
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          {text}
        </Typography>
      </Paper>
    </Grid>
  );
}

export function TrainingResultChart(props: { text: string }) {
  const { text } = props;

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '30vh',
        }}
      >
        <Typography>{text}</Typography>
      </Paper>
    </Grid>
  );
}

export function TimerCard(props: { time: number }) {
  const { time } = props;

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '20vh',
        }}
      >
        <RestTimer restTime={time} />
      </Paper>
    </Grid>
  );
}

export function VideoPlayer(props: { displayedRepIndex: number }) {
  const { displayedRepIndex } = props;
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '57vw',
          justifyContent: 'center',
        }}
      >
        <ReactPlayer url={repVideoUrls[displayedRepIndex]} id="RepVideo" playing loop width="100%" height="100%" />
        {/* <CardMedia sx={{ borderRadius: 3, height: '50vh' }} component="video" autoPlay image={videoPath} loop /> */}
      </Paper>
    </Grid>
  );
}

export function GoodPoint(props: { text: string }) {
  const { text } = props;

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '5vh',
          backgroundColor: '#005555',
          border: 1,
          borderColor: 'grey.500',
          borderRadius: 5,
          boxShadow: 0,
          color: '#00ffff',
        }}
      >
        <Typography variant="h5">{text}</Typography>
      </Paper>
    </Grid>
  );
}

export function BadPoint(props: { text: string }) {
  const { text } = props;

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '10vh',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          【改善ポイント】
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          {text}
        </Typography>
      </Paper>
    </Grid>
  );
}
