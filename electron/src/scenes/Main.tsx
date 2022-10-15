import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import 'typeface-roboto';
import { phaseAtom } from './atoms';
import BodyTracking from './BodyTracking';
import FadeInOut from './decorators/FadeInOut';
import InputPage from './InputPage';
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
      {phase === 0 && (
        <FadeInOut>
          <StartPage />
        </FadeInOut>
      )}
      {phase === 1 && (
        <FadeInOut>
          <InputPage />
        </FadeInOut>
      )}
      {phase === 2 && (
        <FadeInOut>
          <BodyTracking />
        </FadeInOut>
      )}
      {phase === 3 && (
        <FadeInOut>
          <Report1 />
        </FadeInOut>
      )}
      {phase === 4 && (
        <FadeInOut>
          <Report2 />
        </FadeInOut>
      )}
    </ThemeProvider>
  );
}
