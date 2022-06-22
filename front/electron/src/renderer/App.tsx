// import Dashboard from './mui_template/Dashboard';
import { Button } from '@mui/material';
import Dashboard from './mui_template/Dashboard';
import { Hoge, PropTest, ReportSample } from './report';

export default function App() {
  return (
    <>
      {/* <Hoge
        names={{
          lastName: 'Endo',
          firstName: 'Satoshi',
        }}
      /> */}
      <PropTest name="ss" num={1} />
      <Dashboard />
    </>
  );
}
