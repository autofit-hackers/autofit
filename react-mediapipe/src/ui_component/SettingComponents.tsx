import { Stack, Typography } from '@mui/material';
import Slider from '@mui/material/Slider';
import { createContext, useState } from 'react';
import RestTimer from './RestTimer';

// settingsの初期値を定義
const defaultLowerThreshold = 0.8;
const defaultUpperThreshold = 0.9;

type RepCountSetting = { upperThreshold: number; lowerThreshold: number };

// settingsをcontextにして下位コンポーネント(PoseStream)で使用可能にする
export const RepCountSettingContext = createContext<RepCountSetting>({
    lowerThreshold: defaultLowerThreshold,
    upperThreshold: defaultUpperThreshold
});

export function SettingComponents() {
    const [repCountSetting, setRepCountSetting] = useState<RepCountSetting>({
        lowerThreshold: defaultLowerThreshold,
        upperThreshold: defaultUpperThreshold
    });

    return (
        <Stack spacing={1} sx={{ p: 2 }}>
            <Typography>Lower Threshold: {repCountSetting.lowerThreshold}</Typography>
            <Slider
                name="lowerThreshold"
                min={0}
                max={1}
                defaultValue={defaultLowerThreshold}
                onChange={(event: Event, value: number | number[]) => {
                    setRepCountSetting({ ...repCountSetting, lowerThreshold: value as number });
                }}
                aria-label="lower_threshold"
                // valueLabelDisplay="on"
                step={0.01}
            />
            <Typography>Upper Threshold: {repCountSetting.upperThreshold}</Typography>
            <Slider
                name="upperThreshold"
                min={0}
                max={1}
                defaultValue={defaultUpperThreshold}
                onChange={(event: Event, value: number | number[]) => {
                    setRepCountSetting({ ...repCountSetting, upperThreshold: value as number });
                }}
                aria-label="lower_threshold"
                // valueLabelDisplay="on"
                step={0.01}
            />
            <RestTimer restTime={100} />
        </Stack>
    );
}
