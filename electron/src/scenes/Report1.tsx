import { Button } from '@mui/material';
import { Box } from '@mui/system';
import { useAtom } from 'jotai';
import result1 from '../../resources/images/result/result1.png';
import { phaseAtom } from './atoms';
import { LoadingPage } from './LoadingScreen';

export default function Report1() {
  const [, setPhase] = useAtom(phaseAtom);

  return (
    <Box display="flex" justifyContent="center">
      <img src={result1} alt="Result1" style={{ height: '100vh' }} />
      <Button
        sx={{
          position: 'absolute',
          top: '85vh',
          left: '68vw',
          transform: 'translate(-50%, -50%)',
          height: '60px',
          width: '225x',
          borderRadius: '40px',
          backgroundColor: '#4AC0E3',
          color: '#FFFFFF',
          fontSize: '24px',
          fontWeight: 'bold',
          paddingLeft: '70px',
          paddingRight: '70px',
        }}
        onClick={() => {
          setPhase(4);
        }}
      >
        次へ
      </Button>
      <LoadingPage />
    </Box>
  );
}
