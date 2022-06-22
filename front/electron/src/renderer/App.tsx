import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { IntervalReport } from './report';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <IntervalReport
              trainingMenuName="スクワット"
              frontMoviePath="https://www.youtube.com/embed/muuK4SpRR5M"
              instructionText="膝が前に出ています"
            />
          }
        />
      </Routes>
    </Router>
  );
}
