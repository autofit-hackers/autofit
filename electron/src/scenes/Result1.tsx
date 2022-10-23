import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { CardMedia, Grid, Stack, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { ReactElement, useEffect } from 'react';
import result2 from '../../resources/images/muscle-map/muscle-map-squat.png';
import FlatButton from '../stories/FlatButton';
import { stopKinect } from '../utils/kinect';
import { kinectAtom, phaseAtom, setRecordAtom } from './atoms';
import { HeaderGridItem } from './Result2';
import TextWithIcon from '../stories/TextWithIcon';
import { useDummySetRecordIfDebugMode } from './ui-components/SetRecordDebugger';

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // Kinectを停止する
  useEffect(() => {
    stopKinect(kinect);
  }, [kinect]);

  return (
    <Grid container sx={{ paddingBlock: '5vh', maxHeight: '90vh' }}>
      <HeaderGridItem />
      {/* 左側 */}
      <Grid item xs={6} sx={{ mt: '2vh' }}>
        <Stack>
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="flex-end"
            spacing={0}
            sx={{ borderBottomWidth: 1, borderColor: 'black', marginInline: '5vw', paddingBottom: '1vh' }}
          >
            <Typography variant="h1" component="h1" align="center" sx={{ mx: '1vw', fontSize: 150 }} fontWeight="bold">
              {setRecord.resultSummary.totalScore}
            </Typography>
            <Typography variant="h4" component="h1" align="center" sx={{ fontSize: 30 }} fontWeight="bold">
              点
            </Typography>
          </Stack>
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
            measuredValue={`${setRecord.resultSummary.calorieConsumption.toFixed(2)} kcal`}
          />
        </Stack>
      </Grid>
      {/* 右側 */}
      <Grid item xs={6} sx={{ mt: '7vh' }} alignContent="center" justifyContent="center">
        <CardMedia component="img" image={result2} alt="Result2" style={{ height: '60vh', objectFit: 'contain' }} />
      </Grid>
      <Grid item xs={12} sx={{ paddingBlock: '2.5vh', paddingInline: '5vw' }}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing="50vw">
          <FlatButton label="次へ" onClick={() => setPhase((prev) => prev + 1)} />
        </Stack>
      </Grid>
    </Grid>
  );
}
