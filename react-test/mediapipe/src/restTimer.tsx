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
const restTime = 10;
/*レスト時間延長の設定*/
const restExtension = 5;


function Timer({ expiryTimestamp}: { expiryTimestamp: Date }) {
  const {
    seconds,
    minutes,
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
    <Container maxWidth="xs">
    <Doughnut data={{
      datasets: [
        {
          data: [(minutes * 60 + seconds), (restTime - minutes * 60 - seconds)],
          backgroundColor: ["#FF6384", "#36A2EB"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB"],
          borderWidth: 1,
        }
      ]
    }} options={{
        plugins: {
            legend: {
                position: "chartArea" ,
                align: "center",
                maxHeight: 100,
                maxWidth: 200,
                rtl: true,
                textDirection: 'ltr',
                title: {
                    // color: "#241e1f",
                    display: true,
                    font: {
                        size:100,
                    },
                    position: "center",
                    padding:{
                        top:10,
                        bottom:10,
                    },
                    text: "qqqqqqqqq" + String(minutes) + ":" + String(seconds),
                },
            },
        },
        cutout: "90%",
    }}/>
    </Container>

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
          time.setSeconds(time.getSeconds() + restExtension);
          restart(time as unknown as Date);
          }} fullWidth style={{ marginTop: 3, marginBottom: 20}}>
          Extend rest time by {restExtension} seconds
        </Button>
        }
        </Container>
    </div>
  );
}

function RestTimers() {
  const time = new Date();
  time.setSeconds(time.getSeconds() + restTime );
  return (
    <div>
      <Timer expiryTimestamp={time as unknown as Date} />
    </div>
  );
}


export default RestTimers;
