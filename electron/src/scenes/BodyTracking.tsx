import * as Draw2D from '@mediapipe/drawing_utils';
import { Button, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EvaluatedFrames, GraphThreshold } from '../coaching/FormInstructionDebug';
import { formInstructionItemsQWS } from '../coaching/formInstructionItems';
import { getOpeningOfKnee, getOpeningOfToe } from '../coaching/squatAnalysisUtils';
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
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { startKinect } from '../utils/kinect';
import { DEFAULT_POSE_GRID_CONFIG, PoseGrid } from '../utils/poseGrid';
import { startCapturingRepVideo } from '../utils/recordVideo';
import {
  formInstructionItemsAtom,
  kinectAtom,
  phaseAtom,
  playSoundAtom,
  repVideoUrlsAtom,
  setRecordAtom,
} from './atoms';
import RealtimeChart, { ManuallyAddableChart } from './ui-components/RealtimeChart';
import SaveButton from './ui-components/SaveButton';

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
  const [playSound] = useAtom(playSoundAtom);

  // settings to treat outliers in pose estimation
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 2.0, maxConsecutiveOutlierCount: 10 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };

  // 外れ値処理の設定
  // TODO: titration of outlier detection parameters
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlierRef = useRef<FixOutlier>(new FixOutlier(fixOutlierParams));
  const fixWorldOutlierRef = useRef<FixOutlier>(new FixOutlier(fixWorldOutlierPrams));

  // 映像保存用
  const repVideoRecorderRef = useRef<MediaRecorder | null>(null);
  const [repVideoUrls, setRepVideoUrls] = useAtom(repVideoUrlsAtom);

  // レップカウント用
  const repCounterRef = useRef<HTMLDivElement | null>(null);

  // リアルタイムグラフ用
  const evaluatedFrameRef = useRef<EvaluatedFrames>([]);
  const [realtimeChartData, setRealtimeChartData] = useState<number[]>([]);
  const [threshData, setThreshData] = useState<GraphThreshold>({
    upper: 0,
    lower: 0,
    middle: 0,
  });
  const [displayingInstructionIndexOnGraph, setDisplayingInstructionIndexOnGraph] = useState<number>(0);

  // form debug
  const [knee, setKnee] = useState<number[]>([]);
  const [toe, setToe] = useState<number[]>([]);

  const handleReset = () => {
    // 描画
    canvasImageData.current = null;
    // reset fixOutlier state
    fixOutlierRef.current.reset();
    fixWorldOutlierRef.current.reset();
    // トレーニングデータ
    setRef.current = resetSet();
    repRef.current = resetRep(0);
    repState.current = resetRepState();
    // 映像保存
    repVideoRecorderRef.current = null;
    setRepVideoUrls([]);
    playTrainingStartSound(playSound);
    // グラフ
    evaluatedFrameRef.current.forEach((frame, idx) => {
      evaluatedFrameRef.current[idx].evaluatedValues = [];
    });
    setRealtimeChartData([]);
    setThreshData({ upper: 0, middle: 0, lower: 0 });
    setKnee([]);
    setToe([]);

    if (repCounterRef.current) repCounterRef.current.innerText = '0';
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
          new Date().getTime(),
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

        // グラフを更新
        evaluatedFrameRef.current.forEach((item, index) => {
          const evaluateCallback = formInstructionItemsQWS[index].calculateRealtimeValue;
          item.evaluatedValues.push(evaluateCallback(currentPose));
        });

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          // 動画撮影を停止し、配列に保存する
          if (repVideoRecorderRef.current) {
            repVideoRecorderRef.current.stop();
          }

          // 完了したレップのフォームを分析・評価
          repRef.current = calculateKeyframes(repRef.current);
          repRef.current = evaluateRepForm(repRef.current, formInstructionItems);

          // グラフの更新
          const topPose = getTopPose(repRef.current);
          if (topPose !== undefined) {
            evaluatedFrameRef.current.forEach((item, index) => {
              const threshold = formInstructionItemsQWS[index].calculateRealtimeThreshold(topPose);
              evaluatedFrameRef.current[index].threshold = threshold;
            });
          }

          // 完了したレップの情報をセットに追加し、レップをリセットする
          setRef.current.reps = [...setRef.current.reps, repRef.current];
          repRef.current = resetRep(setRef.current.reps.length);

          // レップカウントを読み上げる
          playRepCountSound(setRef.current.reps.length, playSound);

          // RepStateの初期化
          repState.current = resetRepState();

          // 毎レップ判定をして問題ないのでアンマウント時だけではなく、毎レップ終了時にフォーム分析を行う
          setRef.current = recordFormEvaluationResult(setRef.current, formInstructionItems, evaluatedFrameRef.current);
          setRef.current.formEvaluationResults.forEach((item, index) => {
            setRef.current.formEvaluationResults[index].evaluatedValuesPerFrame = evaluatedFrameRef.current[index];
          });
          setSetRecord(setRef.current);

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
      poseGrid = new PoseGrid(gridDivRef.current, {
        ...DEFAULT_POSE_GRID_CONFIG,
        camera: { useOrthographic: false, distance: 200, fov: 75 },
      });
      poseGrid.setCameraAngle();
      poseGrid.isAutoRotating = true;
    }

    if (repCounterRef.current !== null) {
      repCounterRef.current.innerHTML = '0';
    }

    if (evaluatedFrameRef.current !== null) {
      evaluatedFrameRef.current = formInstructionItemsQWS.map((item) => ({
        name: item.name,
        threshold: { upper: 0, lower: 0, middle: 0 },
        evaluatedValues: [],
      }));
    }

    // このコンポーネントのアンマウント時に実行される
    // FIXME: 最初にもよばれる
    return () => {
      // レップとして保存されていない映像は破棄する
      if (repVideoRecorderRef.current != null && repVideoRecorderRef.current.state === 'recording') {
        repVideoRecorderRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const chartData = evaluatedFrameRef.current[displayingInstructionIndexOnGraph].evaluatedValues;
      const thresh = evaluatedFrameRef.current[displayingInstructionIndexOnGraph].threshold;
      // TODO: setRealtimeCartData(chartData) と書きたいが、リアルタイム更新されなくなる
      setRealtimeChartData([chartData[0]].concat(chartData));
      setThreshData(thresh);
    }, 10);

    return () => clearInterval(timer);
  });

  return (
    <>
      <SaveButton object={setRef.current} videoUrls={repVideoUrls} />
      <Button onClick={handleReset} variant="contained" sx={{ position: 'relative', zIndex: 3, ml: 3 }}>
        RESET TRAINING
      </Button>
      <Button
        onClick={() => {
          if (prevPoseRef.current) {
            setKnee(knee.concat([getOpeningOfKnee(prevPoseRef.current)]));
            setToe(toe.concat([getOpeningOfToe(prevPoseRef.current)]));
          }
        }}
      >
        ADD Data to CSV
      </Button>
      <canvas
        ref={canvasRef}
        className="main_canvas"
        style={{
          width: '90vw',
          position: 'relative',
          zIndex: 1,
          top: '5vw',
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
          top: '78vw',
          left: '63vw',
        }}
      >
        <div
          className="pose-grid-container"
          ref={gridDivRef}
          style={{
            position: 'relative',
            height: '100%',
            width: '100%',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
      <div
        ref={repCounterRef}
        style={{ top: '10vw', left: '10vw', fontSize: 100, fontWeight: 'bold', position: 'absolute', zIndex: 3 }}
      />
      <RealtimeChart data={realtimeChartData} thresh={threshData} realtimeUpdate size="large" />
      <RadioGroup
        row
        aria-labelledby="error-group"
        name="error-buttons-group"
        value={displayingInstructionIndexOnGraph}
        onChange={(e, v) => {
          setDisplayingInstructionIndexOnGraph(v as unknown as number);
        }}
      >
        {evaluatedFrameRef.current.map((item, index: number) => (
          <FormControlLabel key={item.name} value={index} control={<Radio />} label={item.name} />
        ))}
      </RadioGroup>
      <ManuallyAddableChart data={[knee, toe]} />
    </>
  );
}
