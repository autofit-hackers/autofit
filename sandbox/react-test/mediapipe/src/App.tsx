import "./App.css";
import PoseStream from "./pose_estimation/poseStream";
//import React from 'react';   TODO: 自動フォーマッティング時に消されるが、ないとエラー履く💩仕様。どうにかせい

function App() {
    return (
        <>
            <PoseStream />
        </>
    );
}

export default App;
