import { Button } from '@mui/material';
import { useRef } from 'react';
import TakeoutReport1 from './TakeoutReport1';
import TakeoutReport2 from './TakeoutReport2';
import TakeoutReport3 from './TakeoutReport3';

function TakeoutReports() {
  // react-to-print
  const componentToPrintRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* You have to place ReactToPrint component as a sibling of the component you want to print. */}
      {/* <ReactToPrint trigger={() => PrintButton()} content={() => componentToPrintRef.current} print={handlePrint} /> */}
      <Button onClick={() => window.print()}> print this out</Button>
      <div ref={componentToPrintRef}>
        <TakeoutReport1 />
        <TakeoutReport2 />
        <TakeoutReport3 />
      </div>
    </div>
  );
}

export default TakeoutReports;
