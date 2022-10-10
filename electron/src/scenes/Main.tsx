import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import InSet from './InSet';
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
      {phase === 1 && <InSet />}
      {phase === 2 && <IntervalReport />}
      {phase === 3 && <TakeoutReports />}
    </ThemeProvider>
  );
}
