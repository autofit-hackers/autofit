import Slider from "@mui/material/Slider";
import { createContext } from "react";
import PoseStream from "./PoseStream";

// settingsの初期値を定義
const defaultUpperThreshold = 0.9;
const defaultLowerThreshold = 0.8;

// settingsをcontextにして下位コンポーネントで使用可能にする
let repCountSetting = { upperThreshold: defaultUpperThreshold, lowerThreshold: defaultLowerThreshold };
export const RepCountSettingContext = createContext(repCountSetting);

export default function PoseEstimation() {
    return (
        <>
            <Slider
                defaultValue={defaultUpperThreshold}
                min={0}
                max={1}
                aria-label="upper_threshold"
                valueLabelDisplay="on"
            />
            <Slider
                defaultValue={defaultLowerThreshold}
                min={0}
                max={1}
                aria-label="lower_threshold"
                valueLabelDisplay="on"
            />
            <RepCountSettingContext.Provider value={repCountSetting}>
                <PoseStream />
            </RepCountSettingContext.Provider>
        </>
    );
}
