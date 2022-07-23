import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import BodyTrack2d from './BodyTrack2d';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <BodyTrack2d />
  </React.StrictMode>,
);

postMessage({ payload: 'removeLoading' }, '*');
