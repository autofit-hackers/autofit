import { Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';

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

interface Props {
  name: string;
  num: number;
}

export const PropTest: React.FC<Props> = ({ name: n, num: v }: Props) => {
  return (
    <>
      <Typography variant="h4" fontWeight={600}>
        僕の名前は {n} {v} です！
      </Typography>
    </>
  );
};
