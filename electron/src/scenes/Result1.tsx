import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { CardMedia, Grid, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { ReactElement } from 'react';
import result2 from '../../resources/images/muscle-map/muscle-map-squat.png';
import { phaseAtom, setRecordAtom } from './atoms';
import { HeaderGridItem } from './Result2';
import { FlatButton } from './ui-components/FlatUI';
import { useDummySetRecordIfDebugMode } from './ui-components/SetRecordDebugger';

function TextWithIcon(props: { icon: ReactElement; text: string }) {
  const { icon, text } = props;

  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="left">
      {icon}
      <Typography variant="h4" component="h1" align="left" sx={{ mx: '5vw' }} fontWeight="bold">
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
      <Typography variant="h3" component="h1" align="left" fontWeight="bold">
        {measuredValue}
      </Typography>
    </Stack>
  );
}

export default function Report1() {
  useDummySetRecordIfDebugMode();
  const [, setPhase] = useAtom(phaseAtom);
  const [setRecord] = useAtom(setRecordAtom);

  return (
    <Grid container sx={{ paddingBlock: '5vh', maxHeight: '90vh' }}>
      <HeaderGridItem />
      {/* 左側 */}
      <Grid item xs={6} sx={{ mt: '5vh' }}>
        <Stack>
          <Typography
            variant="h1"
            component="h1"
            align="center"
            borderBottom={1}
            sx={{ mx: '5vw', fontSize: 150 }}
            fontWeight="bold"
          >
            {setRecord.resultSummary.totalScore}
          </Typography>
          <ShortResult
            metrics={<TextWithIcon icon={<AccessTimeIcon sx={{ fontSize: 60 }} color="primary" />} text="時間" />}
            measuredValue={`${setRecord.resultSummary.timeToComplete}秒`}
          />
          <ShortResult
            metrics={<TextWithIcon icon={<FitnessCenterIcon sx={{ fontSize: 60 }} color="primary" />} text="回数" />}
            measuredValue={`${setRecord.reps.length}/${setRecord.setInfo.targetReps}`}
          />
          <ShortResult
            metrics={
              <TextWithIcon
                icon={<LocalFireDepartmentIcon sx={{ fontSize: 60 }} color="primary" />}
                text="消費カロリー"
              />
            }
            measuredValue={`${setRecord.resultSummary.calorieConsumption} kcal`}
          />
        </Stack>
      </Grid>
      {/* 右側 */}
      <Grid item xs={6} sx={{ mt: '7vh' }} alignContent="center" justifyContent="center">
        <CardMedia component="img" image={result2} alt="Result2" style={{ height: '60vh', objectFit: 'contain' }} />
      </Grid>
      <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing="50vw">
          <FlatButton text="次へ" onClick={() => setPhase((prev) => prev + 1)} />
        </Stack>
      </Grid>
    </Grid>
  );
}
