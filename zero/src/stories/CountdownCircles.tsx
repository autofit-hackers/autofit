import { Box } from '@mui/material';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

interface CountdownCirclesProps {
  key: number;
  isPlaying: boolean;
  duration: number;
  onComplete: () => void;
}

export default function CountdownCircles({ key, isPlaying, duration, onComplete }: CountdownCirclesProps) {
  const textStyle = {
    fontFamily: 'Roboto',
    fontSize: '100px',
    fontWeight: '900',
    color: '#4AC0E3',
  };

  return (
    <Box display="flex" sx={{ justifyContent: 'space-between' }}>
      <CountdownCircleTimer
        key={key}
        isPlaying={isPlaying}
        duration={duration}
        onComplete={onComplete}
        colors={['#4AC0E3', '#F7B801', '#A30000', '#A30000']}
        colorsTime={[3, 2, 1, 0]}
        size={160}
        strokeWidth={12}
      >
        {({ remainingTime }) => <p style={textStyle}>{remainingTime}</p>}
      </CountdownCircleTimer>
    </Box>
  );
}
