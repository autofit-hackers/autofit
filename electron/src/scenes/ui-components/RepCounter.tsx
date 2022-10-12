import { Typography } from '@mui/material';
import filledUnit from '../../../resources/images/repcount-gauge-filled.svg';
import emptyUnit from '../../../resources/images/repcount-gauge-unfilled.svg';

export default function RepCounter(props: { currentCount: number; targetCount: number; style: React.CSSProperties }) {
  const { currentCount, targetCount, style } = props;
  const dummyArray = [];
  for (let i = 0; i < targetCount; i += 1) {
    dummyArray.push(i);
  }
  console.log('currenCount', currentCount);

  return (
    <div style={{ display: 'flex', ...style }}>
      {dummyArray.map((_, i) => (
        <img key={_} src={i < currentCount ? filledUnit : emptyUnit} alt="alt" />
      ))}
      <Typography variant="h2" sx={{ marginLeft: '5%' }}>{`${currentCount}/${targetCount}`}</Typography>
    </div>
  );
}
