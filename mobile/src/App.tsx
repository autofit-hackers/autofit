import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Detail from './2_views/Detail';
import Profile from './2_views/Profile';
import Top from './2_views/Top';
import NotFound from './3_pages/NotFound';
import SignIn from './3_pages/SignIn';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
        <Route path="/detail/" element={<Detail />} />
        <Route path="/sign-in/" element={<SignIn />} />
        <Route path="/profile/" element={<Profile />} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
