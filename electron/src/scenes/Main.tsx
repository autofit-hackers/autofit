import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import BodyTrack2d from './BodyTracking';
import IntervalReport from './IntervalReport';
import StartPage from './StartPage';
import TakeoutReports from './TakeOutReports';
import futuristicTheme from './themes';
import ProductMenu from './ui-components/ProductMenu';

export default function TrainingMain() {
  const [phase] = useAtom(phaseAtom);

  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />
      <ProductMenu />
      {phase === 0 && <StartPage />}
      {phase === 1 && <BodyTrack2d />}
      {phase === 2 && <IntervalReport />}
      {phase === 3 && <TakeoutReports />}
    </ThemeProvider>
  );
}
