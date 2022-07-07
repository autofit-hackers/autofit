import { Button } from '@mui/material';
import Slider from '@mui/material/Slider';
import { createContext, useState } from 'react';
import PoseStream from './PoseStream';

// settingsの初期値を定義
const defaultLowerThreshold = 0.8;
const defaultUpperThreshold = 0.9;

type RepCountSetting = { upperThreshold: number; lowerThreshold: number };

// settingsをcontextにして下位コンポーネント(PoseStream)で使用可能にする
export const RepCountSettingContext = createContext<RepCountSetting>({
    lowerThreshold: defaultLowerThreshold,
    upperThreshold: defaultUpperThreshold
});

export default function SettingsComponent() {
    const [isStreamStarted, setIsStreamStarted] = useState(false);
    const [repCountSetting, setRepCountSetting] = useState<RepCountSetting>({
        lowerThreshold: defaultLowerThreshold,
        upperThreshold: defaultUpperThreshold
    });

    return (
        <>
            <Slider
                name="lowerThreshold"
                min={0}
                max={1}
                defaultValue={defaultLowerThreshold}
                onChange={(event: Event, value: number | number[], activeThumb: number) => {
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
                defaultValue={defaultUpperThreshold}
                onChange={(event: Event, value: number | number[], activeThumb: number) => {
                    setRepCountSetting({ ...repCountSetting, upperThreshold: value as number });
                }}
                aria-label="lower_threshold"
                valueLabelDisplay="on"
                step={0.01}
            />
        </>
    );
}
