import { Box, Button, createTheme, CssBaseline, Grid, Paper, Typography } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { formInstructionItems } from '../coaching/formInstructionItems';
import { stopKinect } from '../utils/kinect';
import { kinectAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';
import { BadPoint, GoodPoint, TimerCard, TrainingResultChart, TrainingStats, VideoReplayer } from './ReportComponents';

export function IntervalReport() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  /*
   * Kinectの終了
   */
  useEffect(() => {
    stopKinect(kinect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
          flexGrow: 1,
          height: 1920,
          width: 1080,
          overflow: 'auto',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing="1vh">
            <TrainingStats text="スクワット10回" />
            {/* video */}
            <VideoReplayer />
            <Grid item xs={6}>
              <Grid container spacing="1vh">
                {/* Chart */}
                <TrainingResultChart text="Chart Here" />
                <TimerCard time={60} />
              </Grid>
            </Grid>
            {/* text instruction */}
            <GoodPoint text="いい姿勢でスクワットができています。背骨の角度はバランスに関わります。この調子でいきましょう。" />
            {/* text instruction */}
            <BadPoint text="少ししゃがみ込みが甘かったですね。太ももが水平になるまで腰を落とすと脚全体筋肉を効果的に鍛えることができます。" />
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export function FuturisticReport() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [repIndexToShow, setValue] = useState(0);
  const [set] = useAtom(setRecordAtom);
  const [displayingInstructionIdx, setIdx] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const repScore: number[] = new Array(set.reps[0].formEvaluationScores.length).fill(0); // FIXME
  set.reps.forEach((rep) => {
    for (let index = 0; index < rep.formEvaluationScores.length; index += 1) {
      repScore[index] += +rep.formEvaluationScores[index] / set.reps.length;
    }
  });

  const getMaxIdxs = (arr: number[]) => {
    const max = Math.max(...arr);
    const indexes = [];

    for (let index = 0; index < arr.length; index += 1) {
      if (arr[index] === max) {
        indexes.push(index);
      }
    }

    return indexes;
  };

  console.log('');
  getMaxIdxs(repScore).forEach((outIdx) => {
    console.log(formInstructionItems[outIdx].itemName);
  });

  console.log();

  const futuristicTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#002884',
        dark: '#002884',
        contrastText: '#fff',
      },
      secondary: {
        main: '#002884',
        dark: '#ba000d',
        contrastText: '#000',
      },
    },
  });

  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: 1920,
          width: 1080,
          overflow: 'auto',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing="1vh">
            {/* 撮影した3:4の動画 */}
            <VideoReplayer />
            {/* トレーニングの3D表示 */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vw',
                }}
              >
                <Typography>{formInstructionItems[displayingInstructionIdx].instructionText}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* 詳細表示する指導の切り替えボタン類 */}
        <Button
          onClick={() => {
            setIdx(0);
          }}
        >
          {formInstructionItems[0].instructionTitle}
        </Button>
        <Button
          onClick={() => {
            setIdx(1);
          }}
        >
          {formInstructionItems[1].instructionTitle}
        </Button>
      </Box>
    </ThemeProvider>
  );
}

export default FuturisticReport;
