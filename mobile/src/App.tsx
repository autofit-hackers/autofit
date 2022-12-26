import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './1_templates/Footer';
import Header from './1_templates/Header';
import Detail from './2_views/Detail';
import Top from './2_views/Top';
import NotFound from './3_pages/NotFound';

function App() {
  return (
    <>
      <Header />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/detail/" element={<Detail />} />
          <Route path="/*/" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Footer />
    </>
  );
}

export default App;
