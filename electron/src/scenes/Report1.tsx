import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { Grid, Stack, Typography } from '@mui/material';
import { ReactElement } from 'react';
import result2 from '../../resources/images/chest.png';
import { useDummySetRecordIfDebugMode } from './ui-components/SetRecordDebugger';

function TextWithIcon(props: { icon: ReactElement; text: string }) {
  const { icon, text } = props;

  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="left">
      {icon}
      <Typography variant="h5" component="h1" align="left" sx={{ mx: '5vw' }} fontWeight="bold">
        {text}
      </Typography>
    </Stack>
  );
}

function ShortResult(props: { icon: ReactElement; text: string }) {
  const { icon, text } = props;

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      borderBottom={1}
      sx={{ marginInline: '5vw', mt: '5vh', p: '1vh' }}
    >
      <TextWithIcon icon={icon} text={text} />
      <Typography variant="h5" component="h1" align="left" fontWeight="bold">
        aaa
      </Typography>
    </Stack>
  );
}

export default function Report1() {
  useDummySetRecordIfDebugMode();

  return (
    <Grid container>
      <Grid item xs={12} sx={{ mt: '7vh' }}>
        <Typography variant="h5" component="h1" align="left" borderBottom={1} sx={{ mx: '5vw' }} fontWeight="bold">
          今回のトレーニング結果
        </Typography>
      </Grid>
      <Grid item xs={6} sx={{ mt: '7vh' }}>
        <Stack>
          <Typography variant="h1" component="h1" align="center" borderBottom={1} sx={{ mx: '5vw' }} fontWeight="bold">
            68
          </Typography>
          <ShortResult text="時間" icon={<AccessTimeIcon fontSize="large" color="primary" />} />
          <ShortResult text="回数" icon={<FitnessCenterIcon fontSize="large" color="primary" />} />
          <ShortResult text="消費カロリー" icon={<LocalFireDepartmentIcon fontSize="large" color="primary" />} />
        </Stack>
      </Grid>
      <Grid item xs={6} sx={{ mt: '7vh' }} alignContent="center" justifyContent="center">
        <img src={result2} alt="Result2" style={{ height: '50vh' }} />
        {/* <CardMedia component="img" image={result2} alt="Result2" style={{ height: '50vh' }} /> */}
      </Grid>
    </Grid>
  );
}

