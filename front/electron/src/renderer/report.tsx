import { Button, Typography } from '@mui/material';

export function ReportSample(): JSX.Element {
  return (
    <Button variant="contained" color="primary">
      props ={' '}
    </Button>
  );
}

export const Hoge = () => {
  const f = 'aa';
  const l = 'AA';
  // { names: { lastName: l, firstName: f } }
  return (
    <Typography variant="h4" fontWeight={600}>
      僕の名前は {f} {l} です！
    </Typography>
  );
};
