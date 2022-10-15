import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';

export default function LoadingScreen() {
  const randomNumberInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomLoadingMessage = [
    '正しいフォームを習得して、ケガ無くトレーニングを続けることが一番大事です。',
    '脚は体の中で最大の筋肉なので、鍛えると基礎代謝向上などへの効果がとても大きいです',
    'スクワットは脚まわりの筋肉をバランスよく鍛えられる良い種目です。',
    'スクワットの世界記録は男性で575kg、女性で310kgらしいですよ。',
    '体を安定させるために、しっかりと腹圧を高めることが大切です。',
    '足の裏全体に体重が乗るように意識しましょう。',
  ];

  return (
    <Stack alignItems="center" spacing={10}>
      <CircularProgress color="inherit" />
      <Typography variant="h4">
        {randomLoadingMessage[randomNumberInRange(0, randomLoadingMessage.length - 1)]}
      </Typography>
    </Stack>
  );
}

export function LoadingPage({ timeout = 2000 }) {
  const [open, setOpen] = useState(true);
  setTimeout(() => setOpen(false), timeout);

  return (
    <Backdrop
      sx={{ color: '#FFFFFF', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.9)' }}
      open={open}
      onClick={() => {
        setOpen(false);
      }}
    >
      <LoadingScreen />
    </Backdrop>
  );
}
