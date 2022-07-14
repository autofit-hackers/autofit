import { createContext } from 'react';

// settingsの初期値を定義
export type RepCountSetting = { upperThreshold: number; lowerThreshold: number };
export const defaultRepCountSettings: RepCountSetting = { upperThreshold: 0.8, lowerThreshold: 0.9 };

// settingsをcontextにして下位コンポーネント(PoseStream)で使用可能にする
export const RepCountSettingContext = createContext<RepCountSetting>(defaultRepCountSettings);
