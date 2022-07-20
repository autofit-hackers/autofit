import { Typography } from '@mui/material';
import { CountdownCircleTimer, TimeProps } from 'react-countdown-circle-timer';

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

export default RestTimer;
