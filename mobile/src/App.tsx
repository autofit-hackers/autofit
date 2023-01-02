import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Detail from './2_views/Detail';
import Top from './2_views/Top';
import NotFound from './3_pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
        <Route path="/detail/" element={<Detail />} />
        <Route path="/*/" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
