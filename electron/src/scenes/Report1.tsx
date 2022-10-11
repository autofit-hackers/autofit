import { Button } from '@mui/material';
import { useAtom } from 'jotai';
import result1 from '../../resources/images/result/result1.png';
import { phaseAtom } from './atoms';

export default function Report1() {
  const [, setPhase] = useAtom(phaseAtom);

  return (
    <>
      <img src={result1} alt="Result1" style={{ height: '100vh' }} />
      <Button
        sx={{
          position: 'absolute',
          top: '770px',
          left: '1000px',
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
          setPhase(5);
        }}
      >
        次へ
      </Button>
    </>
  );
}
