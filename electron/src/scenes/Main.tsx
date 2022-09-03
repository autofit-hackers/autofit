import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import BodyTrack2d from './BodyTracking';
import StartPage from './StartPage';
import TakeoutReport from './TakeOutReports';
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
      {phase === 2 && <TakeoutReport />}
    </ThemeProvider>
  );
}
