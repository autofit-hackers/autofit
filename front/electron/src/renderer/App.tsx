import { MemoryRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LabelBottomNavigation from './BottomNavigation';
import { IntervalReport } from './Report';

const Navigation = () => {
  return (
    <nav>
      <li>
        <Link to="report">Report</Link>
      </li>
    </nav>
  );
};

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigation />} />
          <Route
            path="/report"
            element={
              <IntervalReport
                trainingMenuName="スクワット"
                frontMoviePath="https://www.youtube.com/embed/muuK4SpRR5M"
                instructionText="膝が前に出ています"
              />
            }
          />
        </Routes>
        <LabelBottomNavigation />
      </Router>
    </>
  );
}
