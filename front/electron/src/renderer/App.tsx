// import Dashboard from './mui_template/Dashboard';
import { Button } from '@mui/material';
import Dashboard from './mui_template/Dashboard';
import { IntervalReport, PropTest } from './report';

export default function App() {
  return (
    <>
      <IntervalReport
        trainingMenuName="スクワット"
        frontMoviePath="/aa"
        instructionText="膝が内に入っていますね"
      />
    </>
  );
}
