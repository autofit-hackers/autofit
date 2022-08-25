import { createTheme } from '@mui/material';

const futuristicTheme = createTheme({
  typography: { fontSize: 16, fontFamily: '-apple-system' },
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

export const paperSx = {
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  borderRadius: 2,
  boxShadow: 0,
  backgroundColor: 'white',
};

export const cardSx = { flex: '1 0 auto' };
