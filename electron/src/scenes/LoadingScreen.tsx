import { CircularProgress, Stack, Typography } from '@mui/material';

export default function LoadingScreen() {
  return (
    <Stack alignItems="center" spacing={4}>
      <CircularProgress color="inherit" />
      <Typography>【ランダム】スクワットっていいんですよ？</Typography>
    </Stack>
  );
}
