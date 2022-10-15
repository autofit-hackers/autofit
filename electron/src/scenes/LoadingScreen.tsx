import { CircularProgress, Stack, Typography } from '@mui/material';

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
    <Stack alignItems="center" spacing={4}>
      <CircularProgress color="inherit" />
      <Typography>{randomLoadingMessage[randomNumberInRange(0, randomLoadingMessage.length - 1)]}</Typography>
    </Stack>
  );
}
