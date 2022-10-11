import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import BodyTrackingNew from './BodyTrackingNew';
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
      {phase === 1 && <BodyTrackingNew />}
      {phase === 3 && <IntervalReport />}
      {phase === 4 && <TakeoutReports />}
    </ThemeProvider>
  );
}
