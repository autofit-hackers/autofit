import Slider from "@mui/material/Slider";
import { createContext, useState } from "react";
import PoseStream from "./PoseStream";

// settingsの初期値を定義
const defaultUpperThreshold = 0.9;
const defaultLowerThreshold = 0.8;

type RepCountSetting = { upperThreshold: number; lowerThreshold: number };

// settingsをcontextにして下位コンポーネント(PoseStream)で使用可能にする
export const RepCountSettingContext = createContext({});

export default function PoseEstimation() {
    const [repCountSetting, setRepCountSetting] = useState<RepCountSetting>({
        upperThreshold: defaultUpperThreshold,
        lowerThreshold: defaultLowerThreshold,
    });

    return (
        <>
            <div>
                <Slider
                    name="upperThreshold"
                    value={repCountSetting.upperThreshold}
                    min={0}
                    max={1}
                    onChange={(event: Event, value: number | number[], activeThumb: number) => {
                        setRepCountSetting({ ...repCountSetting, upperThreshold: value as number });
                    }}
                    aria-label="lower_threshold"
                    valueLabelDisplay="on"
                />
                <Slider
                    name="lowerThreshold"
                    value={repCountSetting.lowerThreshold}
                    min={0}
                    max={1}
                    onChange={(event: Event, value: number | number[], activeThumb: number) => {
                        setRepCountSetting({ ...repCountSetting, lowerThreshold: value as number });
                    }}
                    aria-label="lower_threshold"
                    valueLabelDisplay="on"
                />
            </div>
            <RepCountSettingContext.Provider value={repCountSetting}>
                <PoseStream />
            </RepCountSettingContext.Provider>
        </>
    );
}
