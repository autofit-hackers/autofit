import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './welcomeTemplatePage';
import './App.css';

export default function routeSample() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
        </Routes>
      </Router>
    </div>
  );
}
