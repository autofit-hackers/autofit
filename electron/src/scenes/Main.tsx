import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import BodyTrackingNew from './BodyTrackingNew';
import Report1 from './Report1';
import Report2 from './Report2';
import futuristicTheme from './themes';
import ProductMenu from './ui-components/ProductMenu';

export default function TrainingMain() {
  const [phase] = useAtom(phaseAtom);

  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />
      <ProductMenu />
      {phase === 0 && <BodyTrackingNew />}
      {phase === 1 && <Report1 />}
      {phase === 2 && <Report2 />}
    </ThemeProvider>
  );
}
