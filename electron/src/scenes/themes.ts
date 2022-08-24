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

export const paperSx = {
  p: 2,
  display: 'flex',
  flexDirection: 'column',
  border: 1,
  height: '100%',
  width: '100%',
  borderColor: 'grey.500',
  borderRadius: 2,
  boxShadow: 0,
  backgroundColor: 'white',
};
