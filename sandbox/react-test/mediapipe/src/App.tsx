import "./App.css";
import PoseEstimation from "./pose_estimation/PoseEstimation";
//import React from 'react';   TODO: 自動フォーマッティング時に消されるが、ないとエラー履く💩仕様。どうにかせい

function App() {
    return (
        <>
            <PoseEstimation />
        </>
    );
}

export default App;
