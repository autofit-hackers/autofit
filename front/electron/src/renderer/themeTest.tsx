import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Stack, Button, CssBaseline } from '@mui/material';
import MyBtn from './ButtonTest';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#009688',
      contrastText: '#ff0000',
    },
    background: {
      default: '#bdbdbd',
    },
    text: { primary: '#ff9800' },
  },
});

export const apptheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d87274',
      light: '#ffa2a3',
      dark: '#a34449',
    },
  },
});

export const subtheme = createTheme({
  palette: {
    mode: 'light',
    secondary: {
      main: '#5F3E3A',
      light: '#8d6964',
      dark: '#341714',
    },
  },
});

export function SampleComponent(): JSX.Element {
  return (
    <Stack direction="row" spacing={2} sx={{ m: 2, p: 2 }}>
      <Button variant="contained" color="primary">
        primary
      </Button>
      <Button variant="contained" color="secondary">
        secondary
      </Button>
      <Button variant="contained" color="warning">
        warning
      </Button>
      <Button variant="contained" color="info">
        info
      </Button>
      <Button variant="contained" color="success">
        success
      </Button>
    </Stack>
  );
}

export function ThemeSample(): JSX.Element {
  return (
    <div>
      <ThemeProvider theme={apptheme}>
        <CssBaseline />
        <span>apptheme 適用</span>
        <SampleComponent />

        <ThemeProvider theme={subtheme}>
          <span>subtheme 適用</span>
          <SampleComponent />
        </ThemeProvider>
      </ThemeProvider>
      <MyBtn />
    </div>
  );
}
