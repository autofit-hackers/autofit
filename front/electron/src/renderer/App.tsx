import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MyBtn from './buttonTest';
import Dashboard from './mui_template/Dashboard';
import { Hoge, ReportSample } from './report';
import { ThemeSample } from './themeTest';

export default function App() {
  return (
    <>
      {/* <Hoge
        names={{
          lastName: 'Endo',
          firstName: 'Satoshi',
        }}
      /> */}
      <Dashboard />
    </>
  );
}
