import React from "react";
import "./App.css";
import SignIn from "./SignIn";
import PoseEstimation from "./poseEstimation";
import Themes from "./theme";
import RestTimers from "./RestTimers";

function App() {
  return (
    <div >
      <SignIn/>
      <PoseEstimation />
      <Themes />
      <RestTimers />
    </div>
  );
}

export default App;
