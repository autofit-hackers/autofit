import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Button } from '@mui/material';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { calculateRepFormErrorScore, recordFormEvaluationResult } from '../coaching/formInstruction';
import playRepCountSound from '../coaching/voiceGuidance';
import { heightInWorld, kinectToMediapipe, KINECT_POSE_CONNECTIONS, Pose } from '../training_data/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, Rep, resetRep } from '../training_data/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training_data/repState';
import { resetSet, Set } from '../training_data/set';
import { renderBGRA32ColorFrame } from '../utils/drawCanvas';
import { exportData } from '../utils/exporter';
import { startKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/poseGrid';
import { downloadVideo, startCapturingRepVideo, startCapturingSetVideo } from '../utils/recordVideo';
import { formInstructionItemsAtom, kinectAtom, phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

export default function BodyTrack2d() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  let poseGrid: PoseGrid;

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
  const upperThreshold = 0.95; // TODO: temporarily hard coded => useContext(RepCountSettingContext).upperThreshold;
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
        canvasRef.current.width = data.colorImageFrame.width / 2; // 撮影映像の中央部分だけを描画するため、canvasの横幅を半分にする
        canvasRef.current.height = data.colorImageFrame.height;
        canvasImageData.current = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
        // セット映像の記録を開始
        if (setVideoRecorderRef.current == null) {
          setVideoRecorderRef.current = startCapturingSetVideo(canvasRef.current, setVideoUrlRef);
        }
      } else {
        renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);
      }

      if (data.bodyFrame.bodies.length > 0) {
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
          repVideoRecorderRef.current = startCapturingRepVideo(canvasRef.current, setRepVideoUrls);

          // セットの最初の身長を記録
          if (setRef.current.reps.length === 0) {
            repState.current = setStandingHeight(repState.current, heightInWorld(currentPose));
          } else {
            const firstRepTopPose = getTopPose(setRef.current.reps[0]);
            if (firstRepTopPose !== undefined) {
              repState.current = setStandingHeight(repState.current, heightInWorld(firstRepTopPose));
            }
          }

          // レップの開始フラグをoffにする
          repState.current.isFirstFrameInRep = false;
        }

        // フォームを分析し、レップの状態を更新する
        repState.current = checkIfRepFinish(
          repState.current,
          heightInWorld(currentPose),
          lowerThreshold,
          upperThreshold,
        );

        // 現フレームの推定Poseをレップのフォームに追加
        repRef.current = appendPoseToForm(repRef.current, currentPose);

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          console.log('rep end');
          console.log(repRef.current);
          console.log('height', repState.current.standingHeight);

          // 動画撮影を停止し、配列に保存する
          if (repVideoRecorderRef.current) {
            repVideoRecorderRef.current.stop();
          }

          // 完了したレップのフォームを分析・評価
          repRef.current = calculateKeyframes(repRef.current);
          repRef.current = calculateRepFormErrorScore(repRef.current, formInstructionItems);

          // 完了したレップの情報をセットに追加し、レップをリセットする
          setRef.current.reps = [...setRef.current.reps, repRef.current];
          repRef.current = resetRep(setRef.current.reps.length);

          // レップカウントを読み上げる
          playRepCountSound(setRef.current.reps.length);

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

        // PoseGridの描画
        if (poseGrid) {
          poseGrid.updateLandmarks(currentPose.worldLandmarks, KINECT_POSE_CONNECTIONS);
        }
      } else {
        // 姿勢推定結果が空の場合、poseGridのマウス操作だけ更新する
        poseGrid.updateOrbitControls();
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
   * Kinectの開始とPoseGridのセットアップ
   */
  useEffect(() => {
    startKinect(kinect, onResults);
    if (!poseGrid && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGrid = new PoseGrid(gridDivRef.current);
      poseGrid.setCameraAngle();
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
          zIndex: 1,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          margin: 'auto',
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
          className="pose-grid-container"
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
