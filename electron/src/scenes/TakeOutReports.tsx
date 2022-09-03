import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IconButton } from '@mui/material';
import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import TakeoutReport1 from './TakeoutReport1';
import TakeoutReport2 from './TakeoutReport2';
import TakeoutReport3 from './TakeoutReport3';

function TakeoutReports() {
  const [, setPhase] = useAtom(phaseAtom);

  return (
    <div>
      <IconButton
        aria-label="reset-camera-angle"
        color="primary"
        onClick={() => {
          setPhase(1);
        }}
        sx={{ zIndex: 2 }}
      >
        <CheckCircleIcon />
      </IconButton>
      <TakeoutReport1 />
      <TakeoutReport2 />
      <TakeoutReport3 />
    </div>
  );
}

export default TakeoutReports;
