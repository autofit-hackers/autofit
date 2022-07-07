import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { FormControlLabel, Switch } from '@mui/material';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import '../App.css';
import Pose from '../training/pose';
import { RepState, updateRepState } from '../training/repState';
import { RepCountSettingContext } from './PoseEstimation';

export default function PoseStream() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [{ isRotated, w, h }, setConstrains] = useState({ isRotated: true, w: 1280, h: 720 });
    // const grid = LandmarkGrid

    const [repState, setRepState] = useState<RepState>({
        repCount: 0,
        didTouchBottom: false,
        didTouchTop: true,
        isCountUppedNow: false,
        initialBodyHeight: 0,
        tmpBodyHeights: []
    });

    const upperThreshold = useContext(RepCountSettingContext);
    const lowerThreshold = useContext(RepCountSettingContext);

    /*
    依存配列が空であるため、useCallbackの返り値であるコールバック関数はは初回レンダリング時にのみ更新される。
    が、onResults自体は非同期でずっと回ってるっぽい。
    たぶんpose.onResults(onResults);のおかげだと思われる。
    mediapipe定義のPose.onResultsメソッドと、ここで定義されたonResults関数の2種類があるのに注意。
    */
    const onResults = useCallback((results: Results) => {
        const currentPose = new Pose(results); // 自作Poseクラスに代入
        /* とりあえずここにprocessor.recv()の内容を書いていく */ // TODO: resultsがnullのときの回避処理

        // レップ数などの更新
        setRepState(updateRepState(repState, currentPose, 0.6, 0.9));
        if (repState.isCountUppedNow) {
            console.log(currentPose.landmark);
            console.log(repState);
        }

        // レップカウントが増えた時、フォーム評価を実施する

        // 直前のレップのフォームを評価

        const videoWidth = webcamRef.current!.video!.videoWidth;
        const videoHeight = webcamRef.current!.video!.videoHeight;
        canvasRef.current!.width = videoWidth;
        canvasRef.current!.height = videoHeight;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement!.getContext('2d');
        canvasCtx!.save();
        canvasCtx!.clearRect(0, 0, canvasElement!.width, canvasElement!.height);
        canvasCtx!.scale(-1, 1);
        // if (isRotated) {
        //     canvasCtx!.rotate(5 * (Math.PI / 180));
        // }

        canvasCtx!.translate(-700, 0);
        canvasCtx!.drawImage(results.image, 0, 0, canvasElement!.width, canvasElement!.height);
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
                width: 1280,
                height: 720
            });
            camera.start();
        }
    }, [onResults]);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: 'user'
    };

    const [url, setUrl] = useState<string | null>(null);
    const capture = useCallback(() => {
        const imageSrc = webcamRef.current!.getScreenshot();
        if (imageSrc) {
            setUrl(imageSrc);
        }
    }, [webcamRef]);

    return (
        <>
            <div>
                <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Rotate"
                    onChange={() =>
                        setConstrains({
                            isRotated: !isRotated,
                            w: isRotated ? 1280 : 720,
                            h: isRotated ? 720 : 1280
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
                        // position: "absolute",
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        left: 0,
                        right: 0,
                        textAlign: 'center',
                        // zIndex: 1,
                        width: w,
                        height: h
                    }}
                ></canvas>
            </div>
        </>
    );
}
