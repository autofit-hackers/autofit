import { Box, CssBaseline, Grid } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { stopKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, kinectAtom, setRecordAtom } from './atoms';
import futuristicTheme from './themes';
import InstructionTabs from './ui-components/InstructionTabs';
import PoseGridViewer from './ui-components/PoseGridViewer';
import RadarChart from './ui-components/RadarChart';
import ResultDescription from './ui-components/ResultDescription';
import VideoPlayer from './ui-components/VideoPlayer';

export default function IntervalReport() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState(-1);
  const [displayedRepIndex, setDisplayedRepIndex] = useState<number>(
    selectedInstructionIndex >= 0 ? setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex : 0,
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
      poseGridRef.current.setCameraAngle(formInstructionItems[0].poseGridCameraAngle);
    }
  }, [formInstructionItems, kinect]);

  // TODO: UseEffectを使う必要はないかもしれない
  // フォーム指導項目タブが押されたら、レップ映像とPoseGridを切り替える
  useEffect(() => {
    setDisplayedRepIndex(
      selectedInstructionIndex >= 0 ? setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex : 0,
    );
    if (poseGridRef.current !== null) {
      poseGridRef.current.setCameraAngle(
        selectedInstructionIndex >= 0
          ? formInstructionItems[selectedInstructionIndex].poseGridCameraAngle
          : formInstructionItems[0].poseGridCameraAngle,
      );
    }
  }, [formInstructionItems, selectedInstructionIndex, setRecord]);

  // radar chart config and state
  const radarChartIndicators = formInstructionItems.map((instruction) => ({
    name: instruction.label,
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
      <Box sx={{ display: 'flex' }}>
        <InstructionTabs
          selectedInstructionIndex={selectedInstructionIndex}
          setSelectedInstructionIndex={setSelectedInstructionIndex}
          formInstructionItems={formInstructionItems}
        />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* 撮影したRGB映像 */}
              <Grid item xs={6}>
                <VideoPlayer displayedRepIndex={displayedRepIndex} poseGridRef={poseGridRef} />
              </Grid>
              {/* トレーニングの3D表示 */}
              <Grid item xs={6}>
                <PoseGridViewer
                  gridDivRef={gridDivRef}
                  poseGridRef={poseGridRef}
                  cameraPosition={
                    selectedInstructionIndex >= 0
                      ? formInstructionItems[selectedInstructionIndex].poseGridCameraAngle
                      : formInstructionItems[0].poseGridCameraAngle
                  }
                />
              </Grid>
              {/* スコアのレーダーチャート */}
              <Grid item xs={5}>
                <RadarChart indicators={radarChartIndicators} series={radarChartSeries} style={{}} />
              </Grid>
              {/* フォーム評価の説明文 */}
              <Grid item xs={7}>
                <ResultDescription
                  descriptionsForEachRep={
                    selectedInstructionIndex >= 0
                      ? setRecord.formEvaluationResults[selectedInstructionIndex].descriptionsForEachRep
                      : []
                  }
                  isOverallComment={selectedInstructionIndex === -1}
                  summaryDescription={setRecord.summary.description}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
