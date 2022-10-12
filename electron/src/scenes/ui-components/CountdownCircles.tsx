import { Box } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

export default function CountdownCircles(props: {
  key: number;
  isPlaying: boolean;
  duration: number;
  onComplete: () => void;
}) {
  const { key, isPlaying, duration, onComplete } = props;
  const textStyle = {
    fontFamily: 'Roboto',
    fontSize: '80px',
    fontWeight: '500',
    color: '#4AC0E3',
  };

  return (
    <Box display="flex" sx={{ justifyContent: 'space-between' }}>
      <CountdownCircleTimer
        key={key}
        isPlaying={isPlaying}
        duration={duration}
        onComplete={onComplete}
        colors="#4AC0E3"
        size={100}
        strokeWidth={8}
      >
        {({ remainingTime }) => <p style={textStyle}>{remainingTime}</p>}
      </CountdownCircleTimer>
    </Box>
  );
}
