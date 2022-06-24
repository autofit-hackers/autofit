import React, {useState } from "react";
import "./App.css";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import SignIn from "./SignIn";
import PoseEstimation from "./poseEstimation";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { grey, orange, purple } from "@material-ui/core/colors";
import { Container } from "@material-ui/core";
import { useTimer } from "react-timer-hook";

import ReactDOM from "react-dom";
import { CountdownCircleTimer } from 'react-countdown-circle-timer'


import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);



/*レスト時間の指定*/
const restTime = 10;
/*レスト時間延長の設定*/
const restExtension = 5;



const renderTime = ({remainingTime}: {remainingTime: any}) => {
  if (remainingTime === 0) {
    return <div className="timer">Let's start muscle training!</div>;
  }
  return (
    <div className="timer">
    {/* <div className="text">Remaining</div> */}
      <div style={{ fontSize: "40px" }}>{remainingTime}</div>
      <div className="text">seconds</div>
    </div>
  );
};


function RestTimers() {
  return (
    <div className="App">
      <h1>
        Rest Time
      </h1>
      <div className="timer-wrapper">
        <CountdownCircleTimer
          isPlaying
          duration={restTime}
          colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
          colorsTime={[10, 6, 3, 0]}
          onComplete={() => ({ shouldRepeat: false, delay: 1 })}
        >
        {renderTime}
        </CountdownCircleTimer>
      </div>

    </div>
  );
}


export default RestTimers;
