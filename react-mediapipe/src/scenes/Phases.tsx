import { Button } from '@mui/material';
import { useContext } from 'react';
import { TrainingContext } from '../TrainingMain';
import Realtime from './Realtime';
import IntervalReport from './Report';

export const CameraPhase = () => {
    const { allState: phase, stateSetter: setter } = useContext(TrainingContext);

    return (
        <>
            <Button variant="contained" onClick={() => setter(phase + 1)}>
                Phase Ahead
            </Button>
            <Realtime />
        </>
    );
};

export const ReportPhase = () => {
    const { allState: phase, stateSetter: setter } = useContext(TrainingContext);

    return (
        <>
            <Button variant="contained" onClick={() => setter(phase - 1)}>
                Phase Back
            </Button>
            <IntervalReport
                trainingMenuName="aaa"
                frontMoviePath={'https://www.youtube.com/embed/muuK4SpRR5M'}
                instructionText={'bbb'}
            />
        </>
    );
};
