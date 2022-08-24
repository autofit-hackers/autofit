import { Paper, Stack, Typography } from '@mui/material';
import { paperSx } from '../themes';

function TotalScore(props: { score: number }) {
  const { score } = props;

  return (
    <Paper sx={paperSx}>
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
