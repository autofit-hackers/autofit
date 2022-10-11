import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import BodyTrackingNew from './BodyTrackingNew';
import Report1 from './Report1';
import Report2 from './Report2';
import StartPage from './StartPage';
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
      {phase === 4 && <Report1 />}
      {phase === 5 && <Report2 />}
    </ThemeProvider>
  );
}
