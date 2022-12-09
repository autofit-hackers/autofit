import { Typography } from '@mui/material';
import filledUnit from '../../resources/images/repcount-gauge-filled.svg';
import emptyUnit from '../../resources/images/repcount-gauge-unfilled.svg';

interface RepCounterProps {
  currentCount: number;
  targetCount: number;
  // eslint-disable-next-line react/require-default-props
  style?: React.CSSProperties;
}

export default function RepCounter({ currentCount, targetCount, style }: RepCounterProps) {
  const dummyArray = [];
  for (let i = 0; i < targetCount; i += 1) {
    dummyArray.push(i);
  }

  return (
    <div style={{ display: 'flex', ...style }}>
      {dummyArray.map((_, i) => (
        <img key={_} src={i < currentCount ? filledUnit : emptyUnit} alt="alt" />
      ))}
      <Typography variant="h2" sx={{ marginLeft: '5%' }}>{`${currentCount}/${targetCount}`}</Typography>
    </div>
  );
}
