import { Stack, Typography } from '@mui/material';

interface ScoreProps {
  value: number;
}

export default function Score({ value }: ScoreProps) {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="baseline"
      spacing={0}
      sx={{ marginInline: '5vw', paddingBottom: '1vh' }}
    >
      <Typography variant="h1" component="h1" align="center" sx={{ mx: '1vw', fontSize: 150 }} fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="h4" component="h1" align="center" sx={{ fontSize: 40 }} fontWeight="bold">
        点
      </Typography>
    </Stack>
  );
}
