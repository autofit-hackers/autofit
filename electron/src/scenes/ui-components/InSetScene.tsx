/* eslint-disable no-param-reassign */
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { MutableRefObject, RefObject, SetStateAction, useEffect } from 'react';
import { evaluateRepForm, FormInstructionItem, recordFormEvaluationResult } from '../../coaching/formInstruction';
import { playRepCountSound } from '../../coaching/voiceGuidance';
import { heightInWorld, KINECT_POSE_CONNECTIONS, Pose } from '../../training_data/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, Rep, resetRep } from '../../training_data/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../../training_data/repState';
import { Set } from '../../training_data/set';
import { DEFAULT_POSE_GRID_CONFIG, PoseGrid } from '../../utils/poseGrid';
import RepCounter from './RepCounter';

export const InSetProcess = (
  poseGrid: MutableRefObject<PoseGrid | null>,
  currentPose: Pose,
  repState: MutableRefObject<RepState>,
  setRef: MutableRefObject<Set>,
  repRef: MutableRefObject<Rep>,
  formInstructionItems: FormInstructionItem[],
  setSetRecord: (update: SetStateAction<Set>) => void,
  causeReRendering: (value: SetStateAction<number>) => void,
  setPhase: (value: SetStateAction<number>) => void,
) => {
  // PoseGridの描画
  if (poseGrid.current) {
    poseGrid.current.updateLandmarks(currentPose.worldLandmarks, KINECT_POSE_CONNECTIONS);
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
  // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
  if (setRef.current.reps.length === 100) {
    setPhase((prevPhase) => prevPhase + 1);
  }
};

export function InSetScene(props: {
  setRef: MutableRefObject<Set>;
  targetRepCount: number;
  canvasRef: RefObject<HTMLCanvasElement>;
  gridDivRef: MutableRefObject<HTMLDivElement | null>;
  poseGrid: MutableRefObject<PoseGrid | null>;
}) {
  const { setRef, targetRepCount, canvasRef, gridDivRef, poseGrid } = props;

  useEffect(() => {
    if (!poseGrid.current && gridDivRef.current) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      poseGrid.current = new PoseGrid(gridDivRef.current, {
        ...DEFAULT_POSE_GRID_CONFIG,
        camera: { projectionMode: 'perspective', distance: 200, fov: 75 },
      });
      poseGrid.current.setCameraAngle();
      poseGrid.current.isAutoRotating = true;
    }
  });

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RepCounter
        currentCount={setRef.current.reps.length}
        targetCount={targetRepCount}
        style={{ position: 'absolute', top: '5vh', left: '5vh', zIndex: 2 }}
      />
      <canvas ref={canvasRef} className="dummy_canvas" />
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
