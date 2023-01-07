import { Typography } from '@mui/material';
import { useRef } from 'react';
import WeightCamera from 'src/components/ui/WeightCamera';
import { getDefaultSessionState } from '../../core/session-monitor/sessionState';

function RestDebug() {
  // 表示設定
  const labelSx = {
    position: 'fixed',
    right: '5vw',
    bottom: '43vh',
    border: 3,
    paddingBlock: 1.5,
    paddingInline: 4,
    borderRadius: 3,
  };

  // レストとトレーニングの状態
  const sessionState = useRef(getDefaultSessionState());

  return (
    <>
      <WeightCamera originalSize={{ width: 720, height: 480 }} sessionState={sessionState.current} />
      <Typography variant="h3" sx={labelSx}>
        {sessionState.current.isWorkingOut ? 'WORKOUT' : 'REST'}
      </Typography>
      <Typography>Weight: {sessionState.current.totalWeight}kg</Typography>
      <Typography>Equipment: {sessionState.current.detectedEquipment.map((p) => `${p} `)}</Typography>
    </>
  );
}

export default RestDebug;
