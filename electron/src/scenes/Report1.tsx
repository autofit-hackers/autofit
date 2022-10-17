import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { CardMedia, Grid, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { ReactElement } from 'react';
import result2 from '../../resources/images/chest.png';
import { phaseAtom } from './atoms';
import { FlatButton } from './Report2';
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

function ShortResult(props: { metrics: ReactElement; measuredValue: string }) {
  const { metrics, measuredValue } = props;

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      borderBottom={1}
      sx={{ marginInline: '5vw', mt: '5vh', p: '1vh' }}
    >
      {metrics}
      <Typography variant="h5" component="h1" align="left" fontWeight="bold">
        {measuredValue}
      </Typography>
    </Stack>
  );
}

export default function Report1() {
  useDummySetRecordIfDebugMode();
  const [, setPhase] = useAtom(phaseAtom);

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
          <ShortResult
            metrics={<TextWithIcon icon={<AccessTimeIcon fontSize="large" color="primary" />} text="時間" />}
            measuredValue="55:35"
          />
          <ShortResult
            metrics={<TextWithIcon icon={<FitnessCenterIcon fontSize="large" color="primary" />} text="回数" />}
            measuredValue="5回"
          />
          <ShortResult
            metrics={
              <TextWithIcon icon={<LocalFireDepartmentIcon fontSize="large" color="primary" />} text="消費カロリー" />
            }
            measuredValue="92kcal"
          />
        </Stack>
      </Grid>
      <Grid item xs={6} sx={{ mt: '7vh' }} alignContent="center" justifyContent="center">
        <CardMedia component="img" image={result2} alt="Result2" style={{ height: '50vh', objectFit: 'contain' }} />
      </Grid>
      <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing="50vw">
          <FlatButton text="次へ" onClick={() => setPhase((prev) => prev + 1)} />
        </Stack>
      </Grid>
    </Grid>
  );
}
