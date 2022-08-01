import { Grid, Paper, Slider, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useState } from 'react';
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

export function VideoReplayer() {
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  const [repIndexToShow, setValue] = useState(0);

  const marks = [];
  for (let i = 0; i < repVideoUrls.length; i += 1) {
    marks.push({
      value: i + 1,
      label: String(i + 1),
    });
  }

  return (
    <Grid item xs={6}>
      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '51vh',
          justifyContent: 'center',
        }}
      >
        <ReactPlayer url={repVideoUrls[repIndexToShow - 1]} id="RepVideo" playing loop width="27vh" height="48vh" />
        <Slider
          aria-label="Rep Index"
          size="small"
          valueLabelDisplay="auto"
          value={repIndexToShow}
          marks={marks}
          step={1}
          min={1}
          max={repVideoUrls.length}
          onChange={(event, value) => (typeof value === 'number' ? setValue(value) : null)}
        />
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
