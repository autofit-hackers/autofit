import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cardSx } from '../themes';

function TotalScore(props: { score: number }) {
  const { score } = props;

  return (
    <Card>
      <CardContent sx={cardSx}>
        <Typography>あなたのスクワットは</Typography>
        <Stack direction="row" alignItems="flex-end">
          <Typography fontSize={100} fontWeight="bold">
            {score}
          </Typography>
          <Typography>点でした</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default TotalScore;
