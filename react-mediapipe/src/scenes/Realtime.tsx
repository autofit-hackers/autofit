import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { evaluateForm, FormInstructionSettings } from '../coaching/formInstruction';
import { formInstructionItems } from '../coaching/formInstructionItems';
import playRepCountSound from '../coaching/voiceGuidance';
import Pose from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training/repState';
import { appendRepToSet } from '../training/set';
import { phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

function Realtime(props: { doPlaySound: boolean }) {
    const { doPlaySound } = props;
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const screenShotRef = useRef<HTMLCanvasElement>(null);
    const [{ isRotated, w, h }, setConstrains] = useState({ isRotated: true, w: 1080, h: 1920 });

    const [deviceId, setDeviceId] = useState({});
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    /*
     *Phase
     */
    const [, setPhase] = useAtom(phaseAtom);

    /*
     *セット・レップ・RepState変数
     */
    const [setRecord, setSetRecord] = useAtom(setRecordAtom);
    const [rep, setRep] = useState<Rep>({
        form: [],
        keyframesIndex: { top: undefined, bottom: undefined, ascendingMiddle: undefined, descendingMiddle: undefined },
        formEvaluationScores: []
    });
    const [repState, setRepState] = useState<RepState>(resetRepState());

    // settings
    const lowerThreshold = 0.8; // TODO: temporarily hard coded => useContext(RepCountSettingContext).lowerThreshold;
    const upperThreshold = 0.9; // TODO: temporarily hard coded =>  useContext(RepCountSettingContext).upperThreshold;

    /*
     *映像保存用の変数やコールバック関数
     */
    const [, setRepVideoUrls] = useAtom(repVideoUrlsAtom);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // handleStopCaptureClickの直後に呼ばれる
    const handleRecordVideoUrl = useCallback(
        ({ data }: { data: Blob }) => {
            if (data.size > 0) {
                const url = URL.createObjectURL(data);
                setRepVideoUrls((prevUrls) => [...prevUrls, url]);
            }
        },
        [setRepVideoUrls]
    );

    const startCaptureWebcam = useCallback(() => {
        mediaRecorderRef.current = new MediaRecorder(webcamRef.current!.stream!, {
            mimeType: 'video/webm'
        });
        mediaRecorderRef.current.addEventListener('dataavailable', handleRecordVideoUrl);
        mediaRecorderRef.current.start();
    }, [handleRecordVideoUrl]);

    const stopCaptureWebcam = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    }, [mediaRecorderRef]);

    /*
     * 毎フレームまわっている関数
     */
    const onResults = useCallback((results: Results) => {
        const formInstructionSettings: FormInstructionSettings = {
            items: formInstructionItems
        };
        if (canvasRef.current === null || webcamRef.current === null) {
            return;
        }
        const { videoWidth } = webcamRef.current.video!;
        const { videoHeight } = webcamRef.current.video!;
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
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        /* ここにprocessor.recv()の内容を書いていく */
        if ('poseLandmarks' in results) {
            // mediapipeの推論結果を自作のPoseクラスに代入
            const currentPose = new Pose(results);

            // レップの最初のフレームの場合
            if (repState.isFirstFrameInRep) {
                // 動画撮影を開始
                startCaptureWebcam();

                // レップの最初の身長を記録
                setRepState(setStandingHeight(repState, currentPose.height()));

                // レップの開始フラグをoffにする
                setRepState((prevState) => ({ ...prevState, isFirstFrameInRep: false }));
            }

            // フォームを分析し、レップの状態を更新する
            setRepState(checkIfRepFinish(repState, currentPose.height(), lowerThreshold, upperThreshold));

            // 現フレームの推定Poseをレップのフォームに追加
            setRep(appendPoseToForm(rep, currentPose));

            // レップが終了したとき
            if (repState.isRepEnd) {
                // 動画撮影を停止し、配列に保存する
                stopCaptureWebcam();

                // 完了したレップのフォームを分析・評価
                setRep(calculateKeyframes(rep));
                setRep(evaluateForm(rep, formInstructionSettings));

                // 完了したレップの情報をセットに追加し、レップをリセットする
                setSetRecord(appendRepToSet(setRecord, rep));
                setRep(resetRep());

                // レップカウントを読み上げる
                if (doPlaySound) {
                    playRepCountSound(setRecord.reps.length);
                }
                // RepStateの初期化
                setRepState(resetRepState());
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
                canvasCtx,
                [6].map((index) => results.poseLandmarks[index]),
                { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' }
            );
        }

        // RepCountが一定値に達するとphaseを更新し、セットレポートへ
        if (setRecord.reps.length === 100) {
            setPhase(1);
        }

        canvasCtx.restore();

        // レップカウントを表示
        canvasCtx.fillText(setRecord.reps.length.toString(), 50, 50);
        canvasCtx.restore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     *mediapipeの初期設定。
     */
    useEffect(() => {
        const pose = new PoseMediapipe({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
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
                    // TODO
                    if (screenShotRef.current === null || webcamRef.current === null) {
                        return;
                    }
                    const { videoWidth } = webcamRef.current.video!;
                    const { videoHeight } = webcamRef.current.video!;
                    // console.log(videoHeight, videoWidth);
                    screenShotRef.current.width = videoWidth;
                    screenShotRef.current.height = videoHeight;
                    const screenShotElement = screenShotRef.current;
                    const screenShotCtx = screenShotElement.getContext('2d');
                    if (screenShotCtx == null) {
                        return;
                    }
                    // screenShotCtx.beginPath();
                    screenShotCtx.save();
                    screenShotCtx.clearRect(0, 0, screenShotElement.width, screenShotElement.height);
                    screenShotCtx.scale(-1, 1);
                    // screenShotCtx!.translate(-videoWidth, 0);
                    screenShotCtx.rotate(90 * (Math.PI / 180));
                    screenShotCtx.drawImage(
                        webcamRef.current.video!,
                        0,
                        0,
                        screenShotElement.width,
                        screenShotElement.height
                    );
                    screenShotCtx.restore();
                    // TODO
                    await pose.send({ image: screenShotElement });
                },
                width: 480,
                height: 640
            });
            void camera.start();
        }
    }, [onResults]);

    // NOTE: iterate all camera devices
    const handleDevices = useCallback(
        (mediaDevices: MediaDeviceInfo[]) => setDevices(mediaDevices.filter(({ kind }) => kind === 'videoinput')),
        [setDevices]
    );

    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then(handleDevices)
            .catch((reason) => console.log(reason)); // FIXME: remove logging in production
    }, [handleDevices]);

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
            <p>
                Rotation {w} {h}
            </p>
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
            />
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
                    zIndex: 2,
                    width: w,
                    height: h
                }}
            />
            <canvas
                ref={screenShotRef}
                className="output_canvas"
                style={{
                    position: 'absolute',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    zIndex: 1,
                    width: 1080,
                    height: 1920
                }}
            />
            <Typography position="absolute" zIndex={10} fontSize={100}>
                {setRecord.reps.length}
            </Typography>
            {/* FIXME: initialize selector with default cam device */}
            <FormControl color="info" variant="filled" style={{ zIndex: 10, position: 'absolute' }}>
                <InputLabel htmlFor="cam-device-select">Camera</InputLabel>
                <Select
                    labelId="cam-device-select-label"
                    id="webcam-device-select"
                    value={{ deviceId }}
                    label="Camera"
                    onChange={(e) => {
                        setDeviceId(e.target.value as string);
                    }}
                >
                    {devices.map((device) => (
                        <MenuItem key={device.deviceId} value={device.deviceId}>
                            {device.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </>
    );
}

export default Realtime;
