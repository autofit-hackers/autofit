import * as Draw2D from '@mediapipe/drawing_utils';
import { Button } from '@mui/material';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { playRepCountSound, playTrainingStartSound } from '../coaching/voiceGuidance';
import { heightInWorld, kinectToMediapipe, KINECT_POSE_CONNECTIONS, Pose } from '../training_data/pose';
import {
  appendPoseToForm,
  calculateKeyframes,
  evaluateRepForm,
  getTopPose,
  Rep,
  resetRep,
} from '../training_data/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training_data/repState';
import { recordFormEvaluationResult, resetSet, Set } from '../training_data/set';
import { renderBGRA32ColorFrame } from '../utils/drawCanvas';
import { exportData } from '../utils/exporter';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { startKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/poseGrid';
import { downloadVideo, startCapturingRepVideo, startCapturingSetVideo } from '../utils/recordVideo';
import { formInstructionItemsAtom, kinectAtom, phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

export default function BodyTrack2d() {
  // 描画
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  let poseGrid: PoseGrid;

  const [, setPhase] = useAtom(phaseAtom);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // トレーニングデータ
  const [, setSetRecord] = useAtom(setRecordAtom);
  const setRef = useRef<Set>(resetSet());
  const repRef = useRef<Rep>(resetRep(0));
  const repState = useRef<RepState>(resetRepState());

  // settings
  const lowerThreshold = 0.8; // TODO: temporarily hard coded
  const upperThreshold = 0.95;
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);

  // settings to treat outliers in pose estimation
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 2.0, maxConsecutiveOutlierCount: 10 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 200, maxConsecutiveOutlierCount: 10 };

  // 外れ値処理の設定
  // TODO: titration of outlier detection parameters
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlierRef = useRef<FixOutlier>(new FixOutlier(fixOutlierParams));
  const fixWorldOutlierRef = useRef<FixOutlier>(new FixOutlier(fixWorldOutlierPrams));

  // 映像保存用
  const repVideoRecorderRef = useRef<MediaRecorder | null>(null);
  const setVideoRecorderRef = useRef<MediaRecorder | null>(null);
  const setVideoUrlRef = useRef<string>('');
  const [, setRepVideoUrls] = useAtom(repVideoUrlsAtom);

  // レップカウント用
  const repCounterRef = useRef<HTMLDivElement | null>(null);

  const handleSave = () => {
    const now = `${dayjs().format('MM-DD-HH-mm-ss')}`;
    exportData(setRef.current.reps);
    // セット映像の録画を停止する
    if (setVideoUrlRef.current === '' && setVideoRecorderRef.current != null) {
      setVideoRecorderRef.current.stop();
      setTimeout(() => {
        void downloadVideo(setVideoUrlRef.current, `${now}.mp4`);
      }, 1000);
    }
  };

  const handleReset = () => {
    // 描画
    canvasImageData.current = null;
    // reset fixOutlier state
    fixOutlierRef.current.reset();
    fixWorldOutlierRef.current.reset();
    // トレーニングデータ
    setSetRecord(resetSet());
    setRef.current = resetSet();
    repRef.current = resetRep(0);
    repState.current = resetRepState();
    // 映像保存
    repVideoRecorderRef.current = null;
    setVideoRecorderRef.current = null;
    setRepVideoUrls([]);
    setVideoUrlRef.current = '';
    playTrainingStartSound();
  };

  // 毎kinect更新時に実行される
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
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

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
        const rawCurrentPose: Pose = kinectToMediapipe(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          data.bodyFrame.bodies[0].skeleton.joints,
          canvasRef.current,
          true,
        );

        // 外れ値処理
        const currentPose: Pose = rawCurrentPose;
        if (prevPoseRef.current != null) {
          const fixedLandmarks = fixOutlierRef.current.fixOutlierOfLandmarkList(
            prevPoseRef.current.landmarks,
            rawCurrentPose.landmarks,
          );
          currentPose.landmarks = fixedLandmarks;
          const fixedWorldLandmarks = fixWorldOutlierRef.current.fixOutlierOfLandmarkList(
            prevPoseRef.current.worldLandmarks,
            rawCurrentPose.worldLandmarks,
          );
          currentPose.worldLandmarks = fixedWorldLandmarks;
        }
        prevPoseRef.current = currentPose;

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
          console.log('rep end', repRef.current);

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

          // レップカウントを読み上げる
          playRepCountSound(setRef.current.reps.length);

          // RepStateの初期化
          repState.current = resetRepState();

          // 毎レップ判定をして問題ないのでアンマウント時だけではなく、毎レップ終了時にフォーム分析を行う
          // TODO: アンマウント前にまとめて行うほうがスマート
          setSetRecord((prevSetRecord) => recordFormEvaluationResult(prevSetRecord, formInstructionItems));

          // レップカウントを更新
          if (repCounterRef.current) {
            repCounterRef.current.innerHTML = setRef.current.reps.length.toString();
          }
        }

        // pose estimationの結果を描画
        Draw2D.drawLandmarks(canvasCtx, currentPose.landmarks, {
          color: 'white',
          lineWidth: 4,
          radius: 8,
          fillColor: 'lightgreen',
        });
        Draw2D.drawConnectors(canvasCtx, currentPose.landmarks, KINECT_POSE_CONNECTIONS, {
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
        setPhase((prevPhase) => prevPhase + 1);
      }

      // HELPME: いらないかも（repCount描画の名残り）
      canvasCtx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Kinectの開始とPoseGridのセットアップ
  useEffect(() => {
    startKinect(kinect, onResults);
    if (!poseGrid && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGrid = new PoseGrid(gridDivRef.current);
      poseGrid.setCameraAngle();
    }

    if (repCounterRef.current !== null) {
      repCounterRef.current.innerHTML = '0';
    }

    // このコンポーネントのアンマウント時に実行される
    // FIXME: 最初にもよばれる
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
      <Button onClick={handleSave} variant="contained" sx={{ position: 'relative', zIndex: 3, ml: 3 }}>
        SAVE
      </Button>
      <Button onClick={handleReset} variant="contained" sx={{ position: 'relative', zIndex: 3, ml: 3 }}>
        RESET TRAINING
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
      <div ref={repCounterRef} />
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
