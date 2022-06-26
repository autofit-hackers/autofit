
import React, { useCallback, useEffect, useRef, useState } from 'react';
import "./App.css";
import { Pose, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import Webcam from "react-webcam";
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS, NormalizedLandmarkList } from '@mediapipe/pose';
import { FormControlLabel, Switch } from '@material-ui/core';
import { LandmarkGrid } from '@mediapipe/control_utils_3d';


export default function PoseEstimation() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultsRef = useRef<any>(null)
  var camera = null;
  const [{isRotated, w, h}, setConstrains] = useState({isRotated:true, w:1280, h:720});
  // const grid = LandmarkGrid

  const onResults = useCallback((results: Results) => {
    const videoWidth = webcamRef.current!.video!.videoWidth;
    const videoHeight = webcamRef.current!.video!.videoHeight;
    canvasRef.current!.width = 1280;
    canvasRef.current!.height = 720;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement!.getContext("2d");
    canvasCtx!.save();
    canvasCtx!.clearRect(0, 0, canvasElement!.width, canvasElement!.height);
    canvasCtx!.scale(-1, 1)
    // if(isRotated){
    //     canvasCtx!.rotate(90 * (Math.PI / 180))
    // }
    // else {

    // }
    canvasCtx!.translate(-1280, 0)
    canvasCtx!.drawImage(
      results.image,
      0,
      0,
      canvasElement!.width,
      canvasElement!.height
    );
    drawConnectors(canvasCtx!, results.poseLandmarks, POSE_CONNECTIONS, {color: "white", lineWidth: 4});
    drawLandmarks(canvasCtx!, results.poseLandmarks, {color: "white", lineWidth: 4, radius: 8, fillColor: "lightgreen"});
    canvasCtx!.restore();
  }, [])

  // 初期設定
  useEffect(() => {
    const pose = new Pose({
        locateFile: file => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        }
    })

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults)

    if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
        const camera = new Camera(webcamRef.current.video!, {
            onFrame: async () => {
                await pose.send({ image: webcamRef.current!.video! })
            },
            width: 1280,
            height: 720
        })
        camera.start()
    }
}, [onResults])

let videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user'
  }

const [url, setUrl] = useState<string | null>(null);
const capture = useCallback(() => {
  const imageSrc = webcamRef.current!.getScreenshot();
  if (imageSrc) {
    setUrl(imageSrc);
  }
}, [webcamRef]);


return (
  <div >
      <div >
        <FormControlLabel control={<Switch defaultChecked />} label="Rotate" onChange={() => setConstrains({isRotated: !isRotated, w: isRotated?1280:720, h: isRotated?720:1280})}/>
        {<p>Rotation {w} {h}</p>}
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            // zIndex: 1,
            width: 0,
            height: 0,
          }}
        />{" "}
        <canvas
          ref={canvasRef}
          className="output_canvas"
          style={{
            // position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            // zIndex: 1,
            width: 1280,
            height: 720,
          }}
        ></canvas>
      </div>
  </div>


)
}
