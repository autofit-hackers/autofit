import RestoreIcon from '@mui/icons-material/Restore';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  createTheme,
  CssBaseline,
  Grid,
  Paper,
} from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { stopKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/render/poseGrid';
import { formInstructionItemsAtom, kinectAtom, setRecordAtom } from './atoms';
import { GoodPoint, VideoPlayer } from './ReportComponents';

export default function IntervalReport() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState(0);
  const [displayedRepIndex, setDisplayedRepIndex] = useState(0);

  // PoseGrid用
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGridRef = useRef<PoseGrid | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // TODO: gridCameraPositionをSetRecordから取得するようにする
  // Reportコンポーネントマウント時にKinectを停止し、PoseGridを作成する
  useEffect(() => {
    stopKinect(kinect);
    if (!poseGridRef.current && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGridRef.current = new PoseGrid(gridDivRef.current);
      poseGridRef.current.setCamera(formInstructionItems[0].gridCameraPosition);
    }
  }, [formInstructionItems, kinect]);

  // フォーム指導項目タブが押されたら、レップ映像とPoseGridを切り替える
  useEffect(() => {
    setDisplayedRepIndex(setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex);
    if (poseGridRef.current !== null) {
      poseGridRef.current.setCamera(formInstructionItems[selectedInstructionIndex].gridCameraPosition);
    }
  }, [displayedRepIndex, formInstructionItems, selectedInstructionIndex, setRecord, setRecord.formEvaluationResults]);

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
                {/* TODO: Better positioning */}
                <div
                  className="pose-grid-container"
                  ref={gridDivRef}
                  style={{
                    position: 'relative',
                    textAlign: 'center',
                    height: '30vw',
                    width: '30vw',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Button
                  onClick={() => {
                    if (poseGridRef.current !== null) {
                      poseGridRef.current.setCamera(formInstructionItems[selectedInstructionIndex].gridCameraPosition);
                    }
                  }}
                  variant="contained"
                  sx={{ textAlign: 'center', width: '15vw' }}
                >
                  Reset Camera Position
                </Button>
              </Paper>
            </Grid>
            <GoodPoint text={formInstructionItems[selectedInstructionIndex].label ?? 'null'} />
            <BottomNavigation
              showLabels
              value={selectedInstructionIndex}
              onChange={(event, newValue: number) => {
                setSelectedInstructionIndex(newValue);
              }}
              sx={{
                mx: 'auto',
                width: '90%',
                '& .Mui-selected': { backgroundColor: '#005555' },
              }}
            >
              {formInstructionItems.map((instructionItem) => (
                <BottomNavigationAction
                  key={instructionItem.id}
                  label={instructionItem.label}
                  icon={<RestoreIcon />}
                  value={instructionItem.id}
                  sx={{
                    backgroundColor: 'grey.900',
                    borderRadius: 0,
                    border: 1,
                    borderColor: 'grey.500',
                    borderTop: 0,
                    borderTopColor: '#006666',
                    borderBottomRightRadius: 20,
                    borderBottomLeftRadius: 20,
                    boxShadow: 0,
                    mr: 5,
                  }}
                />
              ))}
            </BottomNavigation>

            {/* 詳細表示する指導の切り替えボタン類 */}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
