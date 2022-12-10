import { Typography } from '@mui/material';
import { useAtom } from 'jotai';
import AutofitLogo from '../stories/AutofitLogo';
import { phaseAtom } from './atoms';
import './StartPage.css';

export default function StartPage() {
  const [phase, setPhase] = useAtom(phaseAtom);
  const handleStart = () => {
    setPhase(phase + 1);
  };

  return (
    <div className="gradient-background" style={{ height: '100vh', width: '100vw' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100vw',
          height: '100%',
        }}
      >
        <AutofitLogo scale={1.3} style={{ margin: '50px' }} />
        <button
          type="button"
          className="relative inline-flex items-center justify-center p-0.5 mb-2 mr-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800"
          onClick={handleStart}
        >
          <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-opacity-0">
            トレーニングをはじめる
          </span>
        </button>
        <Typography variant="h6" style={{ color: 'white', marginTop: '50px', fontWeight: 'bold' }}>
          AIでスクワットのフォームを記録・確認してみませんか？
        </Typography>
      </div>
    </div>
  );
}
