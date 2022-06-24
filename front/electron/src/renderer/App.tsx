import { Typography } from '@mui/material';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import LabelBottomNavigation from './BottomNavigation';
import EndoWorkSpace from './Endo';
import IntervalReport from './Report';

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Typography>Main</Typography>} />
          <Route path="/endo" element={<EndoWorkSpace />} />
          <Route path="/kondo" element={<Typography>KONDO</Typography>} />
          <Route path="/ueno" element={<Typography>UENO</Typography>} />
          <Route path="/katsura" element={<Typography>KATSURA</Typography>} />
        </Routes>
        <LabelBottomNavigation />
      </Router>
    </>
  );
}
