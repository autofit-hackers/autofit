import { Box, Card, CardContent, CardHeader, CssBaseline, Grid, Stack, Typography } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { playTrainingEndSound } from '../coaching/voiceGuidance';
import { stopKinect } from '../utils/kinect';
import { GuidelineSymbols, PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, kinectAtom, playSoundAtom, setRecordAtom } from './atoms';
import futuristicTheme, { cardSx } from './themes';
import InstructionSummaryCards from './ui-components/InstructionSummaryCards';
import PoseGridViewer from './ui-components/PoseGridViewer';
import RadarChart from './ui-components/RadarChart';
import TotalScore from './ui-components/TotalScore';
import VideoPlayer from './ui-components/VideoPlayer';

export default function IntervalReport() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState(0);
  const [displayedRepIndex, setDisplayedRepIndex] = useState<number>(
    selectedInstructionIndex >= 0 ? setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex : 0,
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // PoseGrid用
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGridRef = useRef<PoseGrid | null>(null);

  const [playSound] = useAtom(playSoundAtom);

  // Reportコンポーネントマウント時にKinectを停止し、PoseGridを作成する
  useEffect(() => {
    playTrainingEndSound(playSound);
    stopKinect(kinect);
    if (!poseGridRef.current && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGridRef.current = new PoseGrid(gridDivRef.current);
      poseGridRef.current.setCameraAngle(formInstructionItems[0].poseGridCameraAngle);
    }
  }, [formInstructionItems, kinect, playSound]);

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
      poseGridRef.current.drawGuideline(
        selectedInstructionIndex >= 0
          ? setRecord.reps[displayedRepIndex].guidelineSymbolsList[selectedInstructionIndex]
          : ({} as GuidelineSymbols),
      );
    }
  }, [displayedRepIndex, formInstructionItems, selectedInstructionIndex, setRecord]);

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
      <Box
        component="main"
        sx={{
          display: 'flex',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography fontSize={30} fontWeight="bold" sx={{ mb: 4 }}>
            おつかれさまでした。フォーム分析の結果です。
          </Typography>
          <Grid container spacing={3}>
            {/* 撮影したRGB映像 */}
            <Grid item xs={6} alignItems="stretch">
              <Card>
                <CardContent sx={cardSx}>
                  <VideoPlayer displayedRepIndex={displayedRepIndex} poseGridRef={poseGridRef} />
                </CardContent>
              </Card>
            </Grid>
            {/* トレーニングの3D表示 */}
            <Grid item xs={6} alignItems="stretch">
              <Card>
                <CardContent sx={cardSx}>
                  <PoseGridViewer
                    gridDivRef={gridDivRef}
                    poseGridRef={poseGridRef}
                    cameraPosition={formInstructionItems[selectedInstructionIndex].poseGridCameraAngle}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={cardSx}>
                  <CardHeader title="総評" titleTypographyProps={{ fontWeight: 'bold' }} />
                  <Typography variant="h6">{setRecord.summary.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={5}>
              <Stack spacing={3}>
                <TotalScore score={setRecord.summary.totalScore} />
                {/* スコアのレーダーチャート */}
                <RadarChart indicators={radarChartIndicators} series={radarChartSeries} style={{}} />
              </Stack>
            </Grid>
            {/* フォーム評価の説明文 */}
            <Grid item xs={7}>
              <InstructionSummaryCards
                formEvaluationResults={setRecord.formEvaluationResults}
                selectedInstructionIndex={selectedInstructionIndex}
                setSelectedInstructionIndex={setSelectedInstructionIndex}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
