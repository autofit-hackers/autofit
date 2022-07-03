import React from "react";
import RepCountSetting from "../debug/repCountSetting";
import PoseStream from "./PoseStream";

export default function PoseEstimation() {
    return (
        <>
            <RepCountSetting />
            <PoseStream />
        </>
    );
}
