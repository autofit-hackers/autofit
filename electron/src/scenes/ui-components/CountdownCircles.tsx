import { Box } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

export default function CountdownCircles(props: {
  key: number;
  isPlaying: boolean;
  duration: number;
  onComplete: () => void;
}) {
  const { key, isPlaying, duration, onComplete } = props;
  const displayNumbers = [3, 2, 1];

  return (
    <Box display="flex" sx={{ justifyContent: 'space-between' }}>
      {displayNumbers.map((displayNumber) => (
        <CountdownCircleTimer
          key={key}
          isPlaying={isPlaying}
          duration={duration}
          onComplete={onComplete}
          colors="#4AC0E3"
        >
          {() => displayNumber}
        </CountdownCircleTimer>
      ))}
    </Box>
  );
}
