import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestoreIcon from '@mui/icons-material/Restore';
import { BottomNavigation, BottomNavigationAction, Box, createTheme, CssBaseline, Grid, Paper } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { formInstructionItems } from '../coaching/formInstructionItems';
import { KINECT_POSE_CONNECTIONS } from '../training/pose';
import { GridCameraAngle, LandmarkGrid } from '../utils/render/landmarkGrid';
import { repVideoUrlsAtom, setRecordAtom } from './atoms';
import { GoodPoint, VideoReplayer } from './ReportComponents';

export default function IntervalReport() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [repVideoUrls] = useAtom(repVideoUrlsAtom);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [repIndexToShow, setValue] = useState(0);
  const [set] = useAtom(setRecordAtom);
  const [displayingInstructionIdx, setIdx] = useState(0);

  // ぐりぐりの準備
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const landmarkGrid = useRef<LandmarkGrid | null>(null);
  const cameraAngle = useRef<GridCameraAngle>({ theta: 90, phi: 0, distance: 150 });

  useEffect(() => {
    if (!landmarkGrid.current && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      landmarkGrid.current = new LandmarkGrid(gridDivRef.current);
    }
    if (landmarkGrid.current) {
      landmarkGrid.current.setCamera(cameraAngle.current.theta, cameraAngle.current.phi, cameraAngle.current.distance);
      landmarkGrid.current.updateLandmarks(set.reps[0].form[0].worldLandmarks, KINECT_POSE_CONNECTIONS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraAngle.current]);

  // セットを通したスコアの算出
  const repScore: { [key: string]: number } = {};
  const instructionKeys: string[] = [];
  set.reps.forEach((rep) => {
    Object.keys(rep.formErrors).forEach((key) => {
      repScore[key] = rep.formErrors[key];
      instructionKeys.push(key);
    });
  });

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
          <Grid container spacing="1vh">
            {/* 撮影した16:9の動画 */}
            <VideoReplayer />
            {/* トレーニングの3D表示 */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '98vw',
                }}
              >
                <div
                  className="landmark-grid-container"
                  ref={gridDivRef}
                  style={{
                    position: 'relative',
                    height: '90vw',
                    width: '90vw',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }}
                />
              </Paper>
            </Grid>
            <GoodPoint
              text={formInstructionItems[instructionKeys[displayingInstructionIdx]].instructionText ?? 'null'}
            />
            <BottomNavigation
              showLabels
              value={displayingInstructionIdx}
              onChange={(event, newValue: number) => {
                setIdx(newValue);
                cameraAngle.current = formInstructionItems[instructionKeys[newValue]].gridCameraAngle;
              }}
              sx={{
                mx: 'auto',
                width: '90%',
                '& .Mui-selected': { backgroundColor: '#005555' },
              }}
            >
              {/* TODO: ループ処理にまとめる */}
              <BottomNavigationAction
                label={formInstructionItems[instructionKeys[0]].instructionTitle}
                icon={<RestoreIcon />}
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
              <BottomNavigationAction
                label={formInstructionItems[instructionKeys[1]].instructionTitle}
                icon={<FavoriteIcon />}
                sx={{
                  backgroundColor: 'grey.900',
                  borderRadius: 0,
                  border: 1,
                  borderColor: 'grey.500',
                  borderTop: 0,
                  borderTopColor: 'grey.900',
                  borderBottomRightRadius: 20,
                  borderBottomLeftRadius: 20,
                  boxShadow: 0,
                  mr: 5,
                }}
              />
              <BottomNavigationAction
                label={formInstructionItems[instructionKeys[2]].instructionTitle}
                icon={<LocationOnIcon />}
                sx={{
                  backgroundColor: 'grey.900',
                  borderRadius: 0,
                  border: 1,
                  borderColor: 'grey.500',
                  borderTop: 0,
                  borderTopColor: 'grey.900',
                  borderBottomRightRadius: 20,
                  borderBottomLeftRadius: 20,
                  boxShadow: 0,
                  mr: 5,
                }}
              />
              <BottomNavigationAction
                label={formInstructionItems[instructionKeys[3]].instructionTitle}
                icon={<FavoriteIcon />}
                sx={{
                  backgroundColor: 'grey.900',
                  borderRadius: 0,
                  border: 1,
                  borderColor: 'grey.500',
                  borderTop: 0,
                  borderTopColor: 'grey.900',
                  borderBottomRightRadius: 20,
                  borderBottomLeftRadius: 20,
                  boxShadow: 0,
                  mr: 5,
                }}
              />
              <BottomNavigationAction
                label={formInstructionItems[instructionKeys[4]].instructionTitle}
                icon={<LocationOnIcon />}
                sx={{
                  backgroundColor: 'grey.900',
                  borderRadius: 0,
                  border: 1,
                  borderColor: 'grey.500',
                  borderTop: 0,
                  borderTopColor: 'grey.900',
                  borderBottomRightRadius: 20,
                  borderBottomLeftRadius: 20,
                  boxShadow: 0,
                }}
              />
            </BottomNavigation>

            {/* 詳細表示する指導の切り替えボタン類 */}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
