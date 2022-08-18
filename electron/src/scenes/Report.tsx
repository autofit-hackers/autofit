import { Box, createTheme, CssBaseline, Grid, Paper } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { stopKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, kinectAtom, setRecordAtom } from './atoms';
import InstructionNavigation from './report_components/InstructionNavigation';
import PoseGridViewer from './report_components/PoseGridViewer';
import RadarChart from './report_components/RadarChart';
import ResultDescription from './report_components/ResultDescription';
import VideoPlayer from './report_components/VideoPlayer';

export default function IntervalReport() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState(0);
  const [displayedRepIndex, setDisplayedRepIndex] = useState(
    setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex,
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // PoseGrid用
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGridRef = useRef<PoseGrid | null>(null);

  // Reportコンポーネントマウント時にKinectを停止し、PoseGridを作成する
  useEffect(() => {
    stopKinect(kinect);
    if (!poseGridRef.current && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGridRef.current = new PoseGrid(gridDivRef.current);
      poseGridRef.current.setCameraPosition(formInstructionItems[0].gridCameraPosition);
    }
  }, [formInstructionItems, kinect]);

  // TODO: UseEffectを使う必要はないかもしれない
  // フォーム指導項目タブが押されたら、レップ映像とPoseGridを切り替える
  useEffect(() => {
    setDisplayedRepIndex(setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex);
    if (poseGridRef.current !== null) {
      poseGridRef.current.setCameraPosition(formInstructionItems[selectedInstructionIndex].gridCameraPosition);
    }
  }, [displayedRepIndex, formInstructionItems, selectedInstructionIndex, setRecord]);

  const futuristicTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00ffff',
        dark: '#00ffff',
        contrastText: '#fff',
      },
      secondary: {
        main: '#00ffff',
        dark: '#ba000d',
        contrastText: '#000',
      },
    },
  });
  // radar chart config and state
  const radarChartIndicators = formInstructionItems.map((instruction) => ({
    name: instruction.name,
    max: 100,
  }));
  const radarChartSeries = [
    {
      value: setRecord.formEvaluationResults.map((result) => result.score),
      name: '今回のセット',
    },
  ];

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
          {/* TODO: better placement */}
          <RadarChart indicators={radarChartIndicators} series={radarChartSeries} style={{}} />
          <Grid container spacing="0.5vh">
            {/* 撮影したRGB映像 */}
            <VideoPlayer displayedRepIndex={displayedRepIndex} poseGridRef={poseGridRef} />
            {/* トレーニングの3D表示 */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '70vw',
                }}
              >
                <PoseGridViewer
                  gridDivRef={gridDivRef}
                  poseGridRef={poseGridRef}
                  cameraPosition={formInstructionItems[selectedInstructionIndex].gridCameraPosition}
                />
              </Paper>
              <ResultDescription
                descriptionsForEachRep={
                  setRecord.formEvaluationResults[selectedInstructionIndex].descriptionsForEachRep
                }
              />
            </Grid>
            {/* 指導項目の切り替えタブ */}
            <InstructionNavigation
              selectedInstructionIndex={selectedInstructionIndex}
              setSelectedInstructionIndex={setSelectedInstructionIndex}
              formInstructionItems={formInstructionItems}
            />
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
