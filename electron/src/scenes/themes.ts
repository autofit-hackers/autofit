import { createTheme } from '@mui/material';

const futuristicTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ffff',
      dark: '#00ffff',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00ffff',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});

export default futuristicTheme;
