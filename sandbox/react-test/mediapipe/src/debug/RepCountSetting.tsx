//import React from 'react';   TODO: 自動フォーマッティング時に消されるが、ないとエラー履く💩仕様。どうにかせい
import { Slider } from "@mui/material";

export type RepCountSetting = { upperThreshold: number; lowerThreshold: number };

export function RepCountSettingUI() {
    return (
        <>
            <Slider
                defaultValue={0.9}
                min={0}
                max={1}
                aria-label="upper_threshold"
                valueLabelDisplay="on"
            />
            <Slider
                defaultValue={0.8}
                min={0}
                max={1}
                aria-label="lower_threshold"
                valueLabelDisplay="on"
            />
        </>
    );
}
