import { Button } from '@mui/material';
import { useContext } from 'react';
import { TrainingContext } from '../customContexts';
import Realtime from './Realtime';
import IntervalReport from './Report';

export function CameraPhase() {
    const { allState: phase, stateSetter: setter } = useContext(TrainingContext);

    return (
        <>
            <Button variant="contained" onClick={() => setter(phase + 1)}>
                Phase Ahead
            </Button>
            <Realtime doPlaySound={false} />
        </>
    );
}

export function ReportPhase() {
    const { allState: phase, stateSetter: setter } = useContext(TrainingContext);

    return (
        <>
            <Button variant="contained" onClick={() => setter(phase - 1)}>
                Phase Back
            </Button>
            <IntervalReport />
        </>
    );
}
