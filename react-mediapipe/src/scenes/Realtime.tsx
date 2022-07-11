import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { FormControlLabel, Switch, Typography } from '@mui/material';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import '../App.css';
import { evaluateForm, FormInstructionSettings } from '../coaching/formInstruction';
import { formInstructionItems } from '../coaching/formInstructionItems';
import { playRepCountSound } from '../coaching/voiceGuidance';
import { FormState, monitorForm } from '../training/formState';
import Pose from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { appendRepToSet, Set } from '../training/set';
import { TrainingContext } from '../TrainingMain';

export default function PoseStream() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [{ isRotated, w, h }, setConstrains] = useState({ isRotated: true, w: 1080, h: 1920 });
    // const grid = LandmarkGrid

    // セット・レップ・FormState変数を宣言
    const [set, setSet] = useState<Set>({ reps: [] });
    const [rep, setRep] = useState<Rep>({
        form: [],
        keyframesIndex: { top: undefined, bottom: undefined, ascendingMiddle: undefined, descendingMiddle: undefined },
        formEvaluationScores: []
    });
    const [formState, setFormState] = useState<FormState>({
        isFirstFrameInRep: true,
        didTouchBottom: false,
        didTouchTop: true,
        isRepEnd: false,
        standingHeight: 0
    });

    // settings
    const lowerThreshold = 0.8; // XXX: useContext(RepCountSettingContext).lowerThreshold;
    const upperThreshold = 0.9; // XXX: useContext(RepCountSettingContext).upperThreshold;
    const { allState: phase, stateSetter: setter } = useContext(TrainingContext);
    const formInstructionSettings: FormInstructionSettings = {
        items: formInstructionItems
    };

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
        const videoWidth = webcamRef.current.video!.videoWidth;
        const videoHeight = webcamRef.current.video!.videoHeight;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext('2d');

        if (canvasCtx == null) {
            return;
        }
        canvasCtx.font = '50px serif';

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
            // mediapipeの推論結果を自作のPoseクラスに代入
            const currentPose = new Pose(results);

            // フォームのリアルタイム分析を行う（指導はしない）
            setFormState(monitorForm(formState, currentPose, lowerThreshold, upperThreshold));

            // 現フレームの推定Poseをレップのフォームに追加
            setRep(appendPoseToForm(rep, currentPose));

            // レップが終了したとき
            if (formState.isRepEnd) {
                // 完了したレップのフォームを分析・評価
                setRep(calculateKeyframes(rep));
                setRep(evaluateForm(rep, formInstructionSettings));
                console.log(rep.formEvaluationScores);

                // 完了したレップの情報をセットに追加し、レップをリセットする（Form StateはMonitorで内部的にリセットされる）
                setSet(appendRepToSet(set, rep));
                setRep(resetRep(rep));

                // レップカウントを読み上げる
                playRepCountSound(set.reps.length);
            }

            // pose estimationの結果を描画
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: 'white',
                lineWidth: 4
            });
            drawLandmarks(canvasCtx, results.poseLandmarks, {
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
        if (set.reps.length === 2) {
            setter(phase + 1);
        }

        // レップカウントを表示
        canvasCtx.fillText(set.reps.length.toString(), 50, 50);
        canvasCtx.restore();
    }, []);

    /*
    mediapipeの初期設定。
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
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.1,
            minTrackingConfidence: 0.1
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

    useEffect(() => {
        console.log(set.reps.length);
        console.log('############dadada############');
        if (set.reps.length === 2) {
            console.log(set.reps.length);
            console.log('############UNKO############');
        }
    }, [set]);

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
                {set.reps.length}
            </Typography>
        </>
    );
}
