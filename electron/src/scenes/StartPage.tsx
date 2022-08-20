import { useAtom } from 'jotai';
import { phaseAtom } from './atoms';
import AutofitLogo from './report_components/AutofitLogo';
import './StartPage.css';

export default function StartPage() {
  const [, setPhase] = useAtom(phaseAtom);
  const handleStart = () => {
    setPhase(1);
  };

  return (
    <div className="gradient-background" style={{ height: '100vh', width: '100vw' }}>
      <AutofitLogo />
      <div
        style={{
          // display: 'flex',
          // textAlign: 'center',
          // justifyContent: 'center',
          // alignItems: 'center',
          width: '100vw',
          height: '100%',
        }}
      >
        <button
          type="button"
          className="text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
          onClick={handleStart}
          style={{}}
        >
          Start Training with autofit!
        </button>
      </div>
    </div>
  );
}
