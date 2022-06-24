import React, { useState } from "react";
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



import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);


/*レスト時間の指定*/
const rest_time = 100;
/*レスト時間延長の設定*/
const rest_extension = 10;


function Timer({ expiryTimestamp}: { expiryTimestamp: Date }) {
  const {
    seconds,
    minutes,
    isRunning,
    start,
    pause,
    resume,
    restart,
  } = useTimer({
    expiryTimestamp,
    onExpire: () => console.warn("onExpire called"),
  });
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Rest </h1>
      <div style={{ fontSize: "120px" }}>
        <span>{minutes}</span>:<span>{seconds}</span>
      </div>
      <p style={{textAlign:"center"}}>{(minutes === 0 && seconds === 0) ? "Let's start muscle training!" : "Rest Time"}</p>
      <Container maxWidth="xs">
        <Button variant="contained" color="primary" onClick={start} fullWidth style={{ marginTop: 3, marginBottom: 20}}>
          Start
        </Button>
        <Button variant="contained" color="secondary" onClick={pause} fullWidth style={{ marginTop: 3, marginBottom: 20}}>
          Pause
        </Button>
        <Button variant="contained" color="primary" onClick={resume} fullWidth style={{ marginTop: 3, marginBottom: 20}}>
          Resume
        </Button>
        {(minutes === 0 && seconds === 0) &&
        <Button variant="contained" color="secondary" onClick={() => {
          const time = new Date();
          time.setSeconds(time.getSeconds() + rest_extension);
          restart(time as unknown as Date);
          }} fullWidth style={{ marginTop: 3, marginBottom: 20}}>
          Extend rest time by {rest_extension} seconds
        </Button>
        }
        </Container>
    </div>
  );
}

function RestTimers() {
  const time = new Date();
  time.setSeconds(time.getSeconds() + rest_time );

  const data = {
    datasets: [
      {
        data: [500, 500, 500, 500],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        borderWidth: 1
      }
    ]
  };


  return (
    <div>
      <Timer expiryTimestamp={time as unknown as Date} />


      <Container maxWidth="xs">
      <Doughnut data={data} />;
      </Container>

      

    </div>
  );
}





export default RestTimers;
