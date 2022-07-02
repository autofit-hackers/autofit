import { FormControlLabel, Switch } from "@material-ui/core";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import "./App.css";
import React from 'react'
//import React from 'react';   TODO: 自動フォーマッティング時に消されるが、ないとエラー履く💩仕様。どうにかせい
import Pose from "./training/pose";
import RepState from "./training/repState";

export default function PoseEstimation() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseRef = useRef<any>(null);
    var camera = null;
    const [{ isRotated, w, h }, setConstrains] = useState({ isRotated: true, w: 1280, h: 720 });
    // const grid = LandmarkGrid

    const repState = new RepState();

    /*
    依存配列が空であるため、useCallbackの返り値であるコールバック関数はは初回レンダリング時にのみ更新される。
    が、onResults自体は非同期でずっと回ってるっぽい。
    たぶんpose.onResults(onResults);のおかげだと思われる。
    mediapipe定義のPose.onResultsメソッドと、ここで定義されたonResults関数の2種類があるのに注意。
    */
    const onResults = useCallback((results: Results) => {
        poseRef.current = results.poseLandmarks; // 毎回の推定結果を格納
        const currentPose = new Pose(poseRef.current); // 自作Poseクラスに代入

        /* とりあえずここにprocessor.recv()の内容を書いていく */

        // レップ数の更新（updateで回数が増えたらTrue）
        const isLastFrameInRep = repState.updateRepCount(currentPose, 0.9, 0.1);

        // レップカウントが増えた時、フォーム評価を実施する
        // if (isLastFrameInRep) {
        //     // 直前のレップのフォームを評価
        //     set_obj.reps[rep_state.rep_count - 1].recalculate_keyframes();
        //     instructions.evaluate_rep(rep_obj = set_obj.reps[rep_state.rep_count - 1]);
        //     set_obj.make_new_rep();
        // }

        const videoWidth = webcamRef.current!.video!.videoWidth;
        const videoHeight = webcamRef.current!.video!.videoHeight;
        canvasRef.current!.width = 1280;
        canvasRef.current!.height = 720;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement!.getContext("2d");
        canvasCtx!.save();
        canvasCtx!.clearRect(0, 0, canvasElement!.width, canvasElement!.height);
        canvasCtx!.scale(-1, 1);
        // if(isRotated){
        //     canvasCtx!.rotate(90 * (Math.PI / 180))
        // }
        // else {

        // }
        canvasCtx!.translate(-1280, 0);
        canvasCtx!.drawImage(results.image, 0, 0, canvasElement!.width, canvasElement!.height);
        drawConnectors(canvasCtx!, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "white",
            lineWidth: 4,
        });
        drawLandmarks(canvasCtx!, results.poseLandmarks, {
            color: "white",
            lineWidth: 4,
            radius: 8,
            fillColor: "lightgreen",
        });
        canvasCtx!.restore();
    }, []);

    /*
    初期設定。
    依存配列が上で定義されたonResults関数であるため、下のuseEffectが実行されるのは初回レンダリング時のみ。
    （上記の通りonResults関数は初回レンダリング時にしか更新されない）
    */
    useEffect(() => {
        const pose = new PoseMediapipe({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            },
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: true,
            smoothSegmentation: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults); // Pose.onResultsメソッドによって、推定結果を受け取るコールバック関数を登録

        if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null) {
            const camera = new Camera(webcamRef.current.video!, {
                onFrame: async () => {
                    await pose.send({ image: webcamRef.current!.video! });
                },
                width: 1280,
                height: 720,
            });
            camera.start();
        }
    }, [onResults]);

    /* landmarksをconsoleに出力するコールバック関数 */
    const OutputResults = () => {
        const current_pose = new Pose(poseRef.current);
        console.log(current_pose.landmark);
    };

    let videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user",
    };

    const [url, setUrl] = useState<string | null>(null);
    const capture = useCallback(() => {
        const imageSrc = webcamRef.current!.getScreenshot();
        if (imageSrc) {
            setUrl(imageSrc);
        }
    }, [webcamRef]);

    return (
        <div>
            <div>
                <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Rotate"
                    onChange={() =>
                        setConstrains({
                            isRotated: !isRotated,
                            w: isRotated ? 1280 : 720,
                            h: isRotated ? 720 : 1280,
                        })
                    }
                />
                {
                    <p>
                        Rotation {w} {h}
                    </p>
                }
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
    );
}
