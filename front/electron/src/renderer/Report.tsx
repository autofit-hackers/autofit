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
import BarChart from './Chart';
import RestTimers from './RestTimers';

interface IntervalReportProps {
  trainingMenuName: string;
  frontMoviePath: string;
  instructionText: string;
}

const IntervalReport = (prop: IntervalReportProps) => {
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
              <Grid item xs={9}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '20vh',
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
              {/* text instruction */}
              <Grid item xs={3}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '20vh',
                  }}
                >
                  <RestTimers restTime={30} />
                </Paper>
              </Grid>
              {/* Chart */}
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '40vh',
                  }}
                >
                  <BarChart />
                </Paper>
              </Grid>

              {/* video */}
              <Grid item xs={6}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '40vh',
                  }}
                >
                  <CardMedia
                    sx={{ borderRadius: 3, height: 400 }}
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

export default IntervalReport;
