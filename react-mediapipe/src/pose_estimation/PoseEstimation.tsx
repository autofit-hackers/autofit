import { Button } from '@mui/material';
import Slider from '@mui/material/Slider';
import { useState } from 'react';
import PoseStream from './PoseStream';
import { defaultRepCountSettings, RepCountSetting, RepCountSettingContext } from './repCountSettingContext';

export default function PoseEstimation() {
    const [isStreamStarted, setIsStreamStarted] = useState(false);
    const [repCountSetting, setRepCountSetting] = useState<RepCountSetting>(defaultRepCountSettings);

    return (
        <>
            <Slider
                name="lowerThreshold"
                min={0}
                max={1}
                defaultValue={defaultRepCountSettings.lowerThreshold}
                onChange={(event: Event, value: number | number[], _: number) => {
                    setRepCountSetting({ ...repCountSetting, lowerThreshold: value as number });
                }}
                aria-label="lower_threshold"
                valueLabelDisplay="on"
                step={0.01}
            />
            <Slider
                name="upperThreshold"
                min={0}
                max={1}
                defaultValue={defaultRepCountSettings.upperThreshold}
                onChange={(event: Event, value: number | number[], _: number) => {
                    setRepCountSetting({ ...repCountSetting, upperThreshold: value as number });
                }}
                aria-label="lower_threshold"
                valueLabelDisplay="on"
                step={0.01}
            />
            <Button variant="contained" onClick={() => setIsStreamStarted(!isStreamStarted)}>
                {isStreamStarted ? 'Stop' : 'Start'}
            </Button>
            <RepCountSettingContext.Provider value={repCountSetting}>
                {isStreamStarted && <PoseStream />}
            </RepCountSettingContext.Provider>
        </>
    );
}
