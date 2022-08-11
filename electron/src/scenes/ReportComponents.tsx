import { Grid, Paper, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useRef } from 'react';
import { CountdownCircleTimer, TimeProps } from 'react-countdown-circle-timer';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import { PoseGrid } from '../utils/render/poseGrid';
import { repVideoUrlsAtom, setRecordAtom } from './atoms';

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

const renderTime = ({ remainingTime }: TimeProps) => {
  if (remainingTime === 0) {
    return <Typography maxWidth={100}>次のセットを開始しましょう</Typography>;
  }

  return (
    <Typography fontWeight={500} fontSize={50}>
      {remainingTime}
    </Typography>
  );
};

function RestTimer(props: { restTime: number }) {
  const { restTime } = props;

  return (
    <CountdownCircleTimer
      isPlaying
      duration={restTime}
      colors={['#004777', '#F7B801', '#A30000', '#A30000']}
      colorsTime={[10, 6, 3, 0]}
      onComplete={() => ({ shouldRepeat: false, delay: 1 })}
    >
      {renderTime}
    </CountdownCircleTimer>
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

export function VideoPlayer(props: {
  displayedRepIndex: number;
  poseGridRef: React.MutableRefObject<PoseGrid | null>;
}) {
  const videoRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);
  const { displayedRepIndex, poseGridRef } = props;
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  const [setRecord] = useAtom(setRecordAtom);

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
        <ReactPlayer
          ref={videoRef}
          url={repVideoUrls[displayedRepIndex]}
          id="RepVideo"
          playing
          loop
          controls
          width="100%"
          height="100%"
          onReady={() => {
            if (poseGridRef.current) {
              // PoseGridをレップ映像に同期させる
              poseGridRef.current.synchronizeToVideo(videoRef, setRecord, displayedRepIndex);
            }
          }}
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
