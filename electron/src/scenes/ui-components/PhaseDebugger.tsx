import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { Box, Button, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { phaseAtom } from '../atoms';

export default function PhaseDebugger() {
  const [phase, setPhase] = useAtom(phaseAtom);
  const incrementPhase = () => setPhase((prevPhase) => prevPhase + 1);
  const decrementPhase = () => setPhase((prevPhase) => prevPhase - 1);

  return (
    <Box>
      <Typography align="center">Phase: {phase}</Typography>
      <Box sx={{ justifyContent: 'center' }} align="center">
        <Button onClick={incrementPhase}>
          <AddIcon />
        </Button>
        <Button onClick={decrementPhase}>
          <RemoveIcon />
        </Button>
      </Box>
    </Box>
  );
}
