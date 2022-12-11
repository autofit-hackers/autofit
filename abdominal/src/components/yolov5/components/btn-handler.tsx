import { useState } from 'react';
import Webcam from '../utils/webcam';

function ButtonHandler({ cameraRef }: { cameraRef: React.RefObject<HTMLVideoElement> }) {
  const [streaming, setStreaming] = useState(null); // streaming state
  const webcam = new Webcam(); // webcam handler

  return (
    <div className="btn-container">
      <button
        onClick={() => {
          if (streaming === null) {
            // if not streaming
            webcam.open(cameraRef.current); // open webcam
            cameraRef.current.style.display = 'block'; // show camera
            setStreaming('camera'); // set streaming to camera
          } else if (streaming === 'camera') {
            // closing video streaming
            webcam.close(cameraRef.current);
            cameraRef.current.style.display = 'none';
            setStreaming(null);
          } else alert(`Can't handle more than 1 stream\nCurrently streaming : ${streaming}`); // if streaming video
        }}
      >
        {streaming === 'camera' ? 'Close' : 'Open'} Webcam
      </button>
    </div>
  );
}

export default ButtonHandler;
