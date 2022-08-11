import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Button } from '@mui/material';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { evaluateRepForm, recordFormEvaluationResult } from '../coaching/formInstruction';
import { heightInFrame, kinectToMediapipe, KINECT_POSE_CONNECTIONS, Pose } from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training/repState';
import { resetSet, Set } from '../training/set';
import { exportData } from '../utils/exporter';
import { startKinect } from '../utils/kinect';
import { downloadVideo, startCaptureSetVideo, startCaptureWebcam } from '../utils/recordVideo';
import { renderBGRA32ColorFrame } from '../utils/render/drawing';
import { LandmarkGrid } from '../utils/render/landmarkGrid';
import { formInstructionItemsAtom, kinectAtom, phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

export default function BodyTrack2d() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  let landmarkGrid: LandmarkGrid;

  // Phase
  const [, setPhase] = useAtom(phaseAtom);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  /*
   *セット・レップ・RepState変数
   */
  const [, setSetRecord] = useAtom(setRecordAtom);
  const setRef = useRef<Set>(resetSet());
  const repRef = useRef<Rep>(resetRep(0));
  const repState = useRef<RepState>(resetRepState());

  // settings
  const lowerThreshold = 0.8; // TODO: temporarily hard coded => useContext(RepCountSettingContext).lowerThreshold;
  const upperThreshold = 0.9; // TODO: temporarily hard coded => useContext(RepCountSettingContext).upperThreshold;
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);

  // 映像保存用
  const repVideoRecorderRef = useRef<MediaRecorder | null>(null);
  const setVideoRecorderRef = useRef<MediaRecorder | null>(null);
  const [, setRepVideoUrls] = useAtom(repVideoUrlsAtom);
  const setVideoUrlRef = useRef<string>('');

  /*
   * 毎kinect更新時に実行される
   */
  const onResults = useCallback(
    (data: {
      colorImageFrame: { imageData: ImageData; width: number; height: number };
      bodyFrame: { bodies: any[] };
    }) => {
      if (canvasRef.current === null) {
        throw new Error('canvasRef is null');
      }
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx === null) {
        throw new Error('canvasCtx is null');
      }
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.width);

      if (canvasImageData.current === null) {
        canvasRef.current.width = data.colorImageFrame.width;
        canvasRef.current.height = data.colorImageFrame.height;
        canvasImageData.current = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
        // セット映像の記録を開始
        if (setVideoRecorderRef.current == null) {
          setVideoRecorderRef.current = startCaptureSetVideo(canvasRef.current, setVideoUrlRef);
        }
      } else {
        renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);
      }

      if (data.bodyFrame.bodies) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        const currentPose: Pose = kinectToMediapipe(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          data.bodyFrame.bodies[0].skeleton.joints,
          canvasRef.current,
          true,
        );

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // 動画撮影を開始
          repVideoRecorderRef.current = startCaptureWebcam(canvasRef.current, setRepVideoUrls);

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
        repRef.current = appendPoseToForm(repRef.current, currentPose);

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          console.log('rep end');

          // 動画撮影を停止し、配列に保存する
          if (repVideoRecorderRef.current) {
            repVideoRecorderRef.current.stop();
          }

          // 完了したレップのフォームを分析・評価
          repRef.current = calculateKeyframes(repRef.current);
          repRef.current = evaluateRepForm(repRef.current, formInstructionItems);

          // 完了したレップの情報をセットに追加し、レップをリセットする
          setRef.current.reps = [...setRef.current.reps, repRef.current];
          repRef.current = resetRep(setRef.current.reps.length);

          // TODO: レップカウントを読み上げる

          // RepStateの初期化
          repState.current = resetRepState();
        }

        // pose estimationの結果を描画
        drawLandmarks(canvasCtx, currentPose.landmarks, {
          color: 'white',
          lineWidth: 4,
          radius: 8,
          fillColor: 'lightgreen',
        });
        drawConnectors(canvasCtx, currentPose.landmarks, KINECT_POSE_CONNECTIONS, {
          color: 'white',
          lineWidth: 4,
        });

        // LandmarkGridの描画
        if (landmarkGrid) {
          landmarkGrid.updateLandmarks(currentPose.worldLandmarks, KINECT_POSE_CONNECTIONS);
        }
      }

      // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
      if (setRef.current.reps.length === 100) {
        setPhase(1);
      }

      // レップカウントを表示
      canvasCtx.fillText(setRef.current.reps.length.toString(), 50, 50);
      canvasCtx.scale(0.5, 0.5);
      canvasCtx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /*
   * Kinectの開始とLandmarkGridのセットアップ
   */
  useEffect(() => {
    startKinect(kinect, onResults);
    if (!landmarkGrid && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      landmarkGrid = new LandmarkGrid(gridDivRef.current);
      landmarkGrid.setCamera();
    }

    // このコンポーネントのアンマウント時に実行される
    return () => {
      if (repVideoRecorderRef.current != null && repVideoRecorderRef.current.state === 'recording') {
        repVideoRecorderRef.current.stop();
      }
      // セット映像の録画を停止する
      if (setVideoRecorderRef.current != null && setVideoRecorderRef.current.state === 'recording') {
        setVideoRecorderRef.current.stop();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setSetRecord((_) => setRef.current);
      setSetRecord((prevSetRecord) => recordFormEvaluationResult(prevSetRecord, formInstructionItems));
    };
  }, []);

  return (
    <>
      <Button
        onClick={() => {
          const now = `${dayjs().format('MM-DD-HH-mm-ss')}`;
          exportData(setRef.current.reps);
          // セット映像の録画を停止する
          if (setVideoUrlRef.current === '' && setVideoRecorderRef.current != null) {
            setVideoRecorderRef.current.stop();
            setTimeout(() => {
              void downloadVideo(setVideoUrlRef.current, `${now}.mp4`);
            }, 1000);
          }
        }}
        variant="contained"
        sx={{ position: 'relative', zIndex: 3, ml: 3 }}
      >
        SAVE
      </Button>
      <canvas
        ref={canvasRef}
        className="main_canvas"
        style={{
          position: 'absolute',
          marginLeft: 0,
          marginRight: 'auto',
          top: 0,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: 'auto',
          height: 'auto',
        }}
      />
      <div
        className="square-box"
        style={{
          zIndex: 2,
          position: 'absolute',
          width: '30vw',
          height: '30vw',
        }}
      >
        <div
          className="landmark-grid-container"
          ref={gridDivRef}
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </>
  );
}
