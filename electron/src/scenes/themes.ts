import { createTheme } from '@mui/material';

const futuristicTheme = createTheme({
  typography: { fontSize: 17 },
  palette: {
    mode: 'light',
    primary: {
      main: '#E7234E',
      light: '#E7234E',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9EC927',
      light: '#9EC927',
      contrastText: '#000',
    },
  },
});

export default futuristicTheme;
