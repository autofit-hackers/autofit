import { Box, Card, CardContent, CssBaseline, Grid, Typography } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
// eslint-disable-next-line import/no-unresolved
import BaseReactPlayer, { BaseReactPlayerProps } from 'react-player/base';
import autofitLogo from '../../resources/images/autofit-logo.png';
import { KINECT_POSE_CONNECTIONS } from '../training_data/pose';
import { DEFAULT_POSE_GRID_CONFIG, PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';
import futuristicTheme, { cardSx } from './themes';
import RadarChart from './ui-components/RadarChart';
import TotalScore from './ui-components/TotalScore';

export default function TakeoutReport1() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const selectedInstructionIndex = 0;
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  const videoPlayerRef = useRef<BaseReactPlayer<BaseReactPlayerProps>>(null);

  // PoseGrid用
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGridRef = useRef<PoseGrid | null>(null);

  const displayedRepIndex = setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const displayedPoseFrameIndex = setRecord.reps[displayedRepIndex].keyframesIndex.bottom!;
    const currentPoseGridProgress = displayedPoseFrameIndex / setRecord.reps[displayedRepIndex].form.length;
    console.log('currentPoseGridProgress', currentPoseGridProgress);

    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(currentPoseGridProgress, 'fraction');
    }
    if (!poseGridRef.current && gridDivRef.current !== null) {
      poseGridRef.current = new PoseGrid(gridDivRef.current, {
        ...DEFAULT_POSE_GRID_CONFIG,
        camera: { useOrthographic: false, distance: 200, fov: 75 },
      });
      poseGridRef.current.setCameraAngle({
        theta: 80,
        phi: 250,
      });
      if (displayedPoseFrameIndex !== undefined) {
        poseGridRef.current.updateLandmarks(
          setRecord.reps[displayedRepIndex].form[displayedPoseFrameIndex].worldLandmarks,
          KINECT_POSE_CONNECTIONS,
        );
      }
    }
  }, [displayedRepIndex, setRecord.reps]);

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* ページタイトル */}
            <Typography fontSize={30} fontWeight="bold" sx={{ mb: 4 }}>
              スクワットレポート
            </Typography>
            {/* autofitのロゴ */}
            <img src={autofitLogo} alt="autofit" width="100" height="100" />
          </Box>
          <Grid container spacing={3}>
            {/* スクワットの説明文 */}
            <Grid item xs={12} alignItems="stretch">
              <Card sx={cardSx}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    ◆スクワットとは
                  </Typography>
                  <Typography variant="body1" component="div">
                    スクワットは、筋肉トレーニング種目の王様とされています。スクワットを正しく行えば、大臀筋・ハムストリング・内転筋群・背筋群などを効率的に鍛えることが可能な、素晴らしいトレーニング種目です。しかし、少しのフォームの違いで、効果が大きく変わり、場合によっては怪我につながる難しいトレーニング種目でもあります。
                  </Typography>
                  <Typography variant="h5" component="div">
                    ◆スクワットを行うときのポイント
                  </Typography>
                  <Typography variant="body1" component="div">
                    注意するべき点としては、バーベルの軌道、視線の方向、しゃがむ深さ、足の開き具合、足の幅、膝の前後位置、重量、速度など多岐にわたります。
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* 撮影したRGB映像のサムネイル */}
            <Grid item xs={6} alignItems="stretch">
              <Card>
                <CardContent sx={cardSx}>
                  <ReactPlayer
                    ref={videoPlayerRef}
                    url={repVideoUrls[displayedRepIndex]}
                    id="RepVideo"
                    height="100%"
                    width="100%"
                  />
                </CardContent>
              </Card>
            </Grid>
            {/* トレーニングの3D表示のサムネイル */}
            <Grid item xs={6} alignItems="stretch">
              <Card>
                <CardContent sx={cardSx}>
                  <div
                    className="square-box"
                    style={{
                      zIndex: 2,
                      position: 'relative',
                      width: '100%',
                      height: '528px',
                      // FIXME: height はピクセル指定しないと正しく表示されない
                    }}
                  >
                    <div
                      className="pose-grid-container"
                      ref={gridDivRef}
                      style={{
                        position: 'absolute',
                        zIndex: 1,
                        textAlign: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        height: '100%',
                        width: '100%',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              {/* トータルスコア */}
              <TotalScore score={setRecord.summary.totalScore} />
            </Grid>
            <Grid item xs={6}>
              {/* スコアのレーダーチャート */}
              <RadarChart
                formInstructionItems={formInstructionItems}
                formEvaluationResults={setRecord.formEvaluationResults}
                style={{}}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
