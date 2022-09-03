import { createTheme } from '@mui/material';
import HinaGoogleFont from '../../resources/font/GenShinGothic-Regular.ttf';

const futuristicTheme = createTheme({
  typography: { fontSize: 14, fontFamily: 'Raleway, Arial' },
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
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Raleway';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('Raleway'), local('Raleway-Regular'), url(${HinaGoogleFont}) format('woff2');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `,
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
