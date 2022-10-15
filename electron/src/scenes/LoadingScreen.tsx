import { Backdrop, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';

export default function LoadingScreen() {
  const randomNumberInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomLoadingMessage = [
    'データを読み込んでいます0',
    'データを読み込んでいます1',
    'データを読み込んでいます2',
    'データを読み込んでいます3',
    'データを読み込んでいます4',
    'データを読み込んでいます5',
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
