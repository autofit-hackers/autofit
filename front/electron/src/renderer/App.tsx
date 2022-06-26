import { Typography } from '@mui/material';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import LabelBottomNavigation from './BottomNavigation';
import EndoWorkSpace from './Endo';
import KatsuraWorkSpace from './Katsura';
import Main from './Main';

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/endo" element={<EndoWorkSpace />} />
          <Route path="/kondo" element={<Typography>KONDO</Typography>} />
          <Route path="/ueno" element={<Typography>UENO</Typography>} />
          <Route path="/katsura" element={<KatsuraWorkSpace />} />
        </Routes>
        <LabelBottomNavigation />
      </Router>
    </>
  );
}
