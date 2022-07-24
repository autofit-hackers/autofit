import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { FormControlLabel, Switch } from '@mui/material';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { evaluateForm, FormInstructionSettings } from '../coaching/formInstruction';
import { formInstructionItems } from '../coaching/formInstructionItems';
import playRepCountSound from '../coaching/voiceGuidance';
import { heightInFrame, Pose } from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training/repState';
import { Set } from '../training/set';
import { phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

function Realtime(props: { doPlaySound: boolean }) {
  const { doPlaySound } = props;
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenShotRef = useRef<HTMLCanvasElement>(null);
  const [{ isRotated, w, h }, setConstrains] = useState({
    isRotated: true,
    w: 1080,
    h: 1920,
  });

  /*
   *Phase
   */
  const [, setPhase] = useAtom(phaseAtom);

  /*
   *セット・レップ・RepState変数
   */
  const [, setSetRecord] = useAtom(setRecordAtom);
  const set = useRef<Set>({ reps: [] });
  const rep = useRef<Rep>({
    form: [],
    keyframesIndex: {
      top: undefined,
      bottom: undefined,
      ascendingMiddle: undefined,
      descendingMiddle: undefined,
    },
    formEvaluationScores: [],
  });
  const repState = useRef<RepState>(resetRepState());

  // settings
  const lowerThreshold = 0.7; // TODO: temporarily hard coded => useContext(RepCountSettingContext).lowerThreshold;
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
    [setRepVideoUrls],
  );

  const startCaptureWebcam = useCallback(() => {
    if (!(webcamRef.current && webcamRef.current.stream)) {
      throw Error('Webcam stream is null');
    }
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: 'video/webm',
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
      items: formInstructionItems,
    };
    if (canvasRef.current === null || webcamRef.current === null || webcamRef.current.video === null) {
      return;
    }
    const { videoWidth } = webcamRef.current.video;
    const { videoHeight } = webcamRef.current.video;
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
      // mediapipeの推論結果を自作のPose型に代入
      const currentPose: Pose = { landmark: results.poseLandmarks, worldLandmark: results.poseWorldLandmarks };

      // レップの最初のフレームの場合
      if (repState.current.isFirstFrameInRep) {
        // 動画撮影を開始
        startCaptureWebcam();

        // レップの最初の身長を記録
        repState.current = setStandingHeight(repState.current, heightInFrame(currentPose));

        // レップの開始フラグをoffにする
        repState.current.isFirstFrameInRep = false;
      }

      // フォームを分析し、レップの状態を更新する
      repState.current = checkIfRepFinish(
        repState.current,
        heightInFrame(currentPose),
        lowerThreshold,
        upperThreshold,
      );

      // 現フレームの推定Poseをレップのフォームに追加
      rep.current = appendPoseToForm(rep.current, currentPose);

      // レップが終了したとき
      if (repState.current.isRepEnd) {
        console.log('レップ終了');
        // 動画撮影を停止し、配列に保存する
        stopCaptureWebcam();

        // 完了したレップのフォームを分析・評価
        rep.current = calculateKeyframes(rep.current);
        rep.current = evaluateForm(rep.current, formInstructionSettings);

        // 完了したレップの情報をセットに追加し、レップをリセットする
        set.current.reps = [...set.current.reps, rep.current];
        rep.current = resetRep();
        console.log(set.current.reps.length);

        // レップカウントを読み上げる
        if (doPlaySound) {
          playRepCountSound(set.current.reps.length);
        }
        // RepStateの初期化
        repState.current = resetRepState();
      }

      // pose estimationの結果を描画
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: 'white',
        lineWidth: 4,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: 'white',
        lineWidth: 4,
        radius: 8,
        fillColor: 'lightgreen',
      });
      drawLandmarks(
        canvasCtx,
        [6].map((index) => results.poseLandmarks[index]),
        { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' },
      );
    }

    // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
    if (set.current.reps.length === 100) {
      setSetRecord(set.current);
      setPhase(1);
    }

    canvasCtx.restore();

    // レップカウントを表示
    canvasCtx.fillText(set.current.reps.length.toString(), 50, 50);
    canvasCtx.restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   *mediapipeの初期設定。
   */
  useEffect(() => {
    const pose = new PoseMediapipe({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.1,
      minTrackingConfidence: 0.1,
    });

    pose.onResults(onResults); // Pose.onResultsメソッドによって、推定結果を受け取るコールバック関数を登録

    if (typeof webcamRef.current !== 'undefined' && webcamRef.current !== null && webcamRef.current.video !== null) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (screenShotRef.current === null || webcamRef.current === null || webcamRef.current.video === null) {
            return;
          }
          const { videoWidth } = webcamRef.current.video;
          const { videoHeight } = webcamRef.current.video;
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
          screenShotCtx.drawImage(webcamRef.current.video, 0, 0, screenShotElement.width, screenShotElement.height);
          screenShotCtx.restore();
          await pose.send({ image: screenShotElement });
        },
        width: 480,
        height: 640,
      });
      void camera.start();
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
            h: isRotated ? 1080 : 1920,
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
          height: 0,
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
          height: h,
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
          height: 1920,
        }}
      />
      {/* TODO: レップカウントをMUIで表示する */}
      {/* <Typography position="absolute" zIndex={10} fontSize={100}>
                {setRecord.reps.length}
            </Typography> */}
    </>
  );
}

export default Realtime;
