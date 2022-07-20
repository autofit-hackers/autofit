import { CardMedia, Grid, Paper, Typography } from '@mui/material';
import RestTimer from '../ui_component/RestTimer';

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

export function VideoReplayer(props: { videoPath: string }) {
  const { videoPath } = props;

  return (
    <Grid item xs={6}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '50vh',
        }}
      >
        <CardMedia
          sx={{ borderRadius: 3, height: '50vh' }}
          component="video"
          autoPlay
          image={videoPath}
          loop
        />
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
          height: '10vh',
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          【よかったポイント】
        </Typography>
        <Typography variant="h4" fontWeight={600}>
          {text}
        </Typography>
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
