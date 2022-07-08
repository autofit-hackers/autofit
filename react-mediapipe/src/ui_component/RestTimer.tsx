import { CountdownCircleTimer, TimeProps } from 'react-countdown-circle-timer';
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Typography } from '@mui/material';

// ChartJS.register(ArcElement, Tooltip, Legend);

/* レスト時間の指定 */
// const restTime = 10;

const renderTime = ({ remainingTime }: TimeProps) => {
    if (remainingTime === 0) {
        return <Typography maxWidth={100}>次のセットを開始しましょう</Typography>;
    }
    return (
        <>
            <Typography fontWeight={500} fontSize={50}>
                {remainingTime}
            </Typography>
        </>
    );
};

const RestTimer = (props: { restTime: number }) => {
    return (
        <CountdownCircleTimer
            isPlaying
            duration={props.restTime}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[10, 6, 3, 0]}
            onComplete={() => ({ shouldRepeat: false, delay: 1 })}
        >
            {renderTime}
        </CountdownCircleTimer>
    );
};

export default RestTimer;
