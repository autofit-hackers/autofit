import {
  Box,
  CardMedia,
  CssBaseline,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { Container } from '@mui/system';
import SearchAppBar from './AppBar';
import BarChart from './mui_template/Chart';

interface IntervalReportProps {
  trainingMenuName: string;
  frontMoviePath: string;
  instructionText: string;
}

export const IntervalReport = (prop: IntervalReportProps) => {
  const {
    trainingMenuName: tn,
    frontMoviePath: fvpath,
    instructionText: inst,
  } = prop;
  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />

        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <SearchAppBar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              {/* text instruction */}
              <Grid item xs={12} md={3} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    // height: 240,
                  }}
                >
                  <Typography variant="h4" fontWeight={600}>
                    {tn} おつかれさまでした。
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {inst}
                  </Typography>
                </Paper>
              </Grid>
              {/* Chart */}
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <BarChart />
                </Paper>
              </Grid>

              {/* video */}
              <Grid item xs={12} md={8} lg={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    // height: 240,
                  }}
                >
                  <CardMedia
                    sx={{ borderRadius: 3, height: 500 }}
                    component="iframe"
                    src={fvpath}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
};

interface Props {
  name: string;
  age: number;
}

export const PropTest = (prop: Props) => {
  const { name, age } = prop;
  return (
    <>
      <Typography variant="h4" fontWeight={600}>
        僕の名前は {name}、 {age} 歳です！
      </Typography>
    </>
  );
};
