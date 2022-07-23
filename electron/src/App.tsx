import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Hello Electron + Vite + React!</p>
      <p>
        <button onClick={() => setCount((count) => count + 1)}>count is: {count}</button>
      </p>
    </div>
  );
}

export default App;
