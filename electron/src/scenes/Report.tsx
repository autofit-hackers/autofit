import { Box, CssBaseline, Grid, Slider } from '@mui/material';
import { Container } from '@mui/system';
import { useAtom } from 'jotai';
import { useState } from 'react';
import ReactPlayer from 'react-player';
import { repVideoUrlsAtom } from './atoms';
import { BadPoint, GoodPoint, TimerCard, TrainingResultChart, TrainingStats, VideoReplayer } from './ReportComponents';

function IntervalReport() {
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  const [repIndexToShow, setValue] = useState(0);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          width: '100vw',
          overflow: 'auto',
        }}
      >
        <Container>
          <Slider
            aria-label="Rep Index"
            size="small"
            valueLabelDisplay="auto"
            value={repIndexToShow}
            marks
            step={1}
            min={1}
            max={repVideoUrls.length}
            onChange={(event, value) => (typeof value === 'number' ? setValue(value) : null)}
          />
          <ReactPlayer url={repVideoUrls[repIndexToShow - 1]} id="RepVideo" playing loop controls />
        </Container>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={3}>
            <TrainingStats text="スクワット10回" />
            {/* video */}
            <VideoReplayer videoPath="./video_test.webm" />
            <Grid item xs={6}>
              <Grid container spacing={3}>
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

export default IntervalReport;
