import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateRepForm, recordFormEvaluationResult } from '../coaching/formInstruction';
import { playRepCountSound } from '../coaching/voiceGuidance';
import { convertKinectResultsToPose, heightInWorld, KINECT_POSE_CONNECTIONS, Pose } from '../training_data/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, resetRep } from '../training_data/rep';
import { checkIfRepFinish, resetRepState, setStandingHeight } from '../training_data/repState';
import { resetSet } from '../training_data/set';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { startKinect } from '../utils/kinect';
import { DEFAULT_POSE_GRID_CONFIG, PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, kinectAtom, phaseAtom, setRecordAtom } from './atoms';
import RepCounter from './ui-components/RepCounter';

export default function BodyTrack2d() {
  // RGB映像
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // poseGrid
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  let poseGrid: PoseGrid;

  const [, setPhase] = useAtom(phaseAtom);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // トレーニングデータ
  const [, setSetRecord] = useAtom(setRecordAtom);
  const setRef = useRef(resetSet());
  const repRef = useRef(resetRep(0));
  const repState = useRef(resetRepState());

  // リザルト画面のフォーム指導項目
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);

  // 目標レップ数
  const targetRepCount = 8;

  // 外れ値処理の設定
  // TODO: titration of outlier detection parameters
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 0.1, maxConsecutiveOutlierCount: 5 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlierRef = useRef(new FixOutlier(fixOutlierParams));
  const fixWorldOutlierRef = useRef(new FixOutlier(fixWorldOutlierPrams));

  // 背景色
  const theme = createTheme({
    palette: {
      primary: {
        main: '#009688',
        contrastText: '#795548',
      },
      background: {
        default: '#000000',
      },
      text: { primary: '#ff9800' },
    },
  });

  // コンポーネントの再レンダリングを強制するためのstate
  const [, causeReRendering] = useState(0);

  // 毎kinect更新時に実行される
  const onResults = useCallback(
    (data: {
      colorImageFrame: { imageData: ImageData; width: number; height: number };
      bodyFrame: { bodies: any[] };
    }) => {
      if (canvasRef.current === null) {
        throw new Error('canvasRef is null');
      }

      if (canvasRef.current.height !== data.colorImageFrame.height) {
        canvasRef.current.width = data.colorImageFrame.width / 2; // 撮影映像の中央部分だけを描画するため、canvasの横幅を半分にする
        canvasRef.current.height = data.colorImageFrame.height;
      }
      if (data.bodyFrame.bodies.length > 0) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        const rawCurrentPose: Pose = convertKinectResultsToPose(
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

        // PoseGridの描画
        if (poseGrid) {
          poseGrid.updateLandmarks(currentPose.worldLandmarks, KINECT_POSE_CONNECTIONS);
        }

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
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
        repState.current = checkIfRepFinish(repState.current, heightInWorld(currentPose), 0.8, 0.95);

        // 現フレームの推定Poseをレップのフォームに追加
        repRef.current = appendPoseToForm(repRef.current, currentPose);

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          // 完了したレップのフォームを分析・評価
          repRef.current = calculateKeyframes(repRef.current);
          repRef.current = evaluateRepForm(repRef.current, formInstructionItems);

          // 完了したレップの情報をセットに追加し、レップをリセットする
          setRef.current.reps = [...setRef.current.reps, repRef.current];
          repRef.current = resetRep(setRef.current.reps.length);

          // レップカウントを読み上げる
          playRepCountSound(setRef.current.reps.length); // ここで音声を再生

          // RepStateの初期化
          repState.current = resetRepState();

          // アンマウント時だけではなく、毎レップ終了時にフォーム分析を行う
          setRef.current = recordFormEvaluationResult(setRef.current, formInstructionItems);
          setSetRecord(setRef.current);

          // レップカウントゲージ更新のため再レンダリングさせる
          causeReRendering((prev) => prev + 1);
        }
      } else {
        // 姿勢推定結果が空の場合、poseGridのマウス操作だけ更新する
        poseGrid.updateOrbitControls();
      }

      // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
      if (setRef.current.reps.length === 100) {
        setPhase((prevPhase) => prevPhase + 1);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Kinectの開始とPoseGridのセットアップ
  useEffect(() => {
    startKinect(kinect, onResults);
    if (!poseGrid && gridDivRef.current) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGrid = new PoseGrid(gridDivRef.current, {
        ...DEFAULT_POSE_GRID_CONFIG,
        camera: { projectionMode: 'perspective', distance: 200, fov: 75 },
      });
      poseGrid.setCameraAngle();
      poseGrid.isAutoRotating = true;
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RepCounter
        currentCount={setRef.current.reps.length}
        targetCount={targetRepCount}
        style={{ position: 'absolute', top: '5vh', left: '5vh', zIndex: 2 }}
      />
      <canvas ref={canvasRef} className="fake_canvas" />
      <div
        className="square-box"
        style={{
          zIndex: 1,
          position: 'absolute',
          width: '90vh',
          height: '90vh',
          top: '5vh',
          left: '5vh',
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
    </ThemeProvider>
  );
}
