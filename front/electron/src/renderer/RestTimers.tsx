import './App.css';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

/* レスト時間の指定 */
const restTime = 10;

const renderTime = ({ remainingTime }: { remainingTime: any }) => {
  if (remainingTime === 0) {
    return (
      <div className="timer">
        Let&rsquo;s start <br /> muscle training!
      </div>
    );
  }
  return (
    <div className="timer">
      <div style={{ fontSize: '50px' }}>{remainingTime}</div>
      <div>seconds</div>
    </div>
  );
};

function RestTimers() {
  return (
    <div className="App">
      <h1>Rest Time</h1>
      <div className="timer-wrapper">
        <CountdownCircleTimer
          isPlaying
          duration={restTime}
          colors={['#004777', '#F7B801', '#A30000', '#A30000']}
          colorsTime={[10, 6, 3, 0]}
          onComplete={() => ({ shouldRepeat: false, delay: 1 })}
        >
          {renderTime}
        </CountdownCircleTimer>
      </div>
    </div>
  );
}

export default RestTimers;
