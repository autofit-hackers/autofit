import { Paper, Stack, Typography } from '@mui/material';

function TotalScore(props: { score: number }) {
  const { score } = props;

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        height: '100%',
        width: '100%',
        borderColor: 'grey.500',
        borderRadius: 5,
        boxShadow: 0,
        alignItems: 'center',
      }}
    >
      <Typography>あなたのスクワットは</Typography>
      <Stack direction="row" alignItems="flex-end">
        <Typography fontSize={100} fontWeight="bold">
          {score}
        </Typography>
        <Typography>点でした</Typography>
      </Stack>
    </Paper>
  );
}

export default TotalScore;
