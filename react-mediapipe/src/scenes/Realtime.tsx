import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { FormControlLabel, Switch, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import '../App.css';
import Pose from '../training/pose';
import { RepState, updateRepState } from '../training/repState';

export default function Realtime() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [{ isRotated, w, h }, setConstrains] = useState({ isRotated: true, w: 1080, h: 1920 });

    const [repState, setRepState] = useState<RepState>({
        repCount: 0,
        didTouchBottom: false,
        didTouchTop: true,
        isCountUppedNow: false,
        initialBodyHeight: 0,
        tmpBodyHeights: []
    });

    const lowerThreshold = 0.8; // XXX: useContext(RepCountSettingContext).lowerThreshold;
    const upperThreshold = 0.9; // XXX: useContext(RepCountSettingContext).upperThreshold;

    /*
    依存配列が空であるため、useCallbackの返り値であるコールバック関数はは初回レンダリング時にのみ更新される。
    が、onResults自体は非同期でずっと回ってるっぽい。
    たぶんpose.onResults(onResults);のおかげだと思われる。
    mediapipe定義のPose.onResultsメソッドと、ここで定義されたonResults関数の2種類があるのに注意。
    */
    const onResults = useCallback((results: Results) => {
        if (canvasRef.current === null || webcamRef.current === null) {
            return;
        }
        const videoWidth = webcamRef.current!.video!.videoWidth;
        const videoHeight = webcamRef.current!.video!.videoHeight;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement!.getContext('2d');

        if (canvasCtx == null) {
            return;
        }

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        // このあとbeginPath()が必要らしい：https://developer.mozilla.org/ja/docs/Web/API/CanvasRenderingContext2D/clearRect

        // if (isRotated) {
        //     canvasCtx!.rotate(5 * (Math.PI / 180));
        // }

        canvasCtx!.scale(-1, 1);
        canvasCtx!.translate(-videoWidth, 0);
        canvasCtx!.drawImage(results.image, 0, 0, canvasElement!.width, canvasElement!.height);

        /* ここにprocessor.recv()の内容を書いていく */
        if ('poseLandmarks' in results) {
            const currentPose = new Pose(results); // 自作Poseクラスに代入

            // レップ数などの更新
            setRepState(updateRepState(repState, currentPose, lowerThreshold, upperThreshold));

            // レップカウントが増えた時、フォーム評価を実施する

            // 直前のレップのフォームを評価
            drawConnectors(canvasCtx!, results.poseLandmarks, POSE_CONNECTIONS, {
                color: 'white',
                lineWidth: 4
            });
            drawLandmarks(canvasCtx!, results.poseLandmarks, {
                color: 'white',
                lineWidth: 4,
                radius: 8,
                fillColor: 'lightgreen'
            });
            drawLandmarks(
                canvasCtx!,
                [6].map((index) => results.poseLandmarks[index]),
                { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' }
            );
        }

        // レップカウントを表示
        // canvasCtx.font = '50px serif';
        // canvasCtx.fillText(repState.repCount.toString(), 50, 50);
        canvasCtx.restore();
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
            }
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: true,
            smoothSegmentation: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults); // Pose.onResultsメソッドによって、推定結果を受け取るコールバック関数を登録

        if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null) {
            const camera = new Camera(webcamRef.current.video!, {
                onFrame: async () => {
                    await pose.send({ image: webcamRef.current!.video! });
                },
                width: 1920,
                height: 1080
            });
            camera.start();
        }
    }, [onResults]);

    return (
        <>
            <FormControlLabel
                control={<Switch defaultChecked />}
                label="Rotate"
                onChange={() =>
                    setConstrains({
                        isRotated: !isRotated,
                        w: isRotated ? 1920 : 1080,
                        h: isRotated ? 1080 : 1920
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
                    position: 'absolute',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    // zIndex: 1,
                    width: 0,
                    height: 0
                }}
            />{' '}
            <canvas
                ref={canvasRef}
                className="output_canvas"
                style={{
                    position: 'absolute',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    zIndex: 1,
                    width: w,
                    height: h
                }}
            ></canvas>
            <Typography position={'absolute'} zIndex={10} fontSize={100}>
                {repState.repCount}
            </Typography>
        </>
    );
}
