import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SampleComponent from './report';
import Welcome from './welcomeTemplatePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SampleComponent />} />
      </Routes>
    </Router>
  );
}
