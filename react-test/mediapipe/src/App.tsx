import React from "react";
import "./App.css";
import SignIn from "./SignIn";
import PoseEstimation from "./poseEstimation";
import Themes from "./theme";
import RestTimer from "./restTimer";

function App() {
  return (
    <div >
      <SignIn/>
      <PoseEstimation />
      <Themes />
      <RestTimer />
    </div>
  );
}

export default App;
