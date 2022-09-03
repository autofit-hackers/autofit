import { Divider } from '@mui/material';
import TakeoutReport1 from './TakeoutReport1';
import TakeoutReport2 from './TakeoutReport2';
import TakeoutReport3 from './TakeoutReport3';

function TakeoutReports() {
  return (
    <div>
      <TakeoutReport1 />
      <Divider />
      <TakeoutReport2 />
      <Divider />
      <TakeoutReport3 />
    </div>
  );
}

export default TakeoutReports;
