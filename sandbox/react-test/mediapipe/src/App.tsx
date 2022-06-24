import React from "react";
import "./App.css";
import SignIn from "./SignIn";
import PoseEstimation from "./poseEstimation";
import Themes from "./theme";

function App() {
  return (
    <div >
      <SignIn/>
      <PoseEstimation />
      <Themes />
    </div>
  );
}

export default App;
