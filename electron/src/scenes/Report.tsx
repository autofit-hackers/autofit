import { Box, createTheme, CssBaseline, Grid } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { stopKinect } from '../utils/kinect';
import { kinectAtom, repVideoUrlsAtom } from './atoms';
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  /*
   * Kinectの終了
   */
  useEffect(() => {
    stopKinect(kinect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Box sx={{ display: 'flex' }}>
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
    </ThemeProvider>
  );
}

export default FuturisticReport;
