/* eslint-disable no-param-reassign */
import { createTheme, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { MutableRefObject, RefObject, SetStateAction, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Checkpoint, evaluateRep, evaluateSet } from '../coaching/formEvaluation';
import { playRepCountSound } from '../coaching/voiceGuidance';
import RepCounter from '../stories/RepCounter';
import { heightInWorld, KINECT_POSE_CONNECTIONS, Pose } from '../training_data/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, Rep, resetRep } from '../training_data/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training_data/repState';
import { Set } from '../training_data/set';
import { DEFAULT_POSE_GRID_CONFIG, PoseGrid } from '../utils/poseGrid';
import { startCapturingSetVideo, startCapturingWebcam } from '../utils/recordVideo';

export const InSetProcess = (
  canvasRef: RefObject<HTMLCanvasElement>,
  poseGrid: MutableRefObject<PoseGrid | null>,
  currentPose: Pose,
  repState: MutableRefObject<RepState>,
  setRef: MutableRefObject<Set>,
  repRef: MutableRefObject<Rep>,
  checkpoints: Checkpoint[],
  setSetRecord: (update: SetStateAction<Set>) => void,
  causeReRendering: (value: SetStateAction<number>) => void,
  setPhase: (value: SetStateAction<number>) => void,
  targetRepCount: number,
  frontVideoRecorder: MutableRefObject<MediaRecorder | null>,
  sideVideoRecorder: MutableRefObject<MediaRecorder | null>,
  webcamRef: MutableRefObject<Webcam | null>,
) => {
  // PoseGridの描画
  if (poseGrid.current) {
    poseGrid.current.updateLandmarks(currentPose.worldLandmarks, KINECT_POSE_CONNECTIONS);
  }

  // 映像撮影開始
  if (!frontVideoRecorder.current && canvasRef.current && webcamRef.current) {
    frontVideoRecorder.current = startCapturingSetVideo(canvasRef.current, setRef.current);
    sideVideoRecorder.current = startCapturingWebcam(webcamRef.current, setRef.current);
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
    repRef.current = evaluateRep(repRef.current, checkpoints);

    // 完了したレップの情報をセットに追加し、レップをリセットする
    setRef.current.reps = [...setRef.current.reps, repRef.current];
    repRef.current = resetRep(setRef.current.reps.length);

    // レップカウントを読み上げる
    playRepCountSound(setRef.current.reps.length); // ここで音声を再生

    // RepStateの初期化
    repState.current = resetRepState();

    // アンマウント時だけではなく、毎レップ終了時にフォーム分析を行う
    setRef.current = evaluateSet(setRef.current, checkpoints);
    setSetRecord(setRef.current);

    // レップカウントゲージ更新のため再レンダリングさせる
    causeReRendering((prev) => prev + 1);
  }
  // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
  // eslint-disable-next-line eqeqeq
  if (setRef.current.reps.length == targetRepCount) {
    // WARN:  等価演算子（==）を厳密等価演算子（===）にすると、目標レップ数を入力フォームで変更した場合にReport1への遷移に失敗する（原因不明）
    if (frontVideoRecorder.current && sideVideoRecorder.current) {
      frontVideoRecorder.current.stop();
      sideVideoRecorder.current.stop();
    }
    setTimeout(() => setPhase(3), 1000);
  }
};

export function InSetScene(props: {
  currentRepCount: number;
  targetRepCount: number;
  canvasRef: RefObject<HTMLCanvasElement>;
  gridDivRef: MutableRefObject<HTMLDivElement | null>;
  poseGrid: MutableRefObject<PoseGrid | null>;
}) {
  const { currentRepCount, targetRepCount, canvasRef, gridDivRef, poseGrid } = props;

  useEffect(() => {
    if (!poseGrid.current && gridDivRef.current) {
      poseGrid.current = new PoseGrid(gridDivRef.current, {
        ...DEFAULT_POSE_GRID_CONFIG,
        camera: { projectionMode: 'perspective', distance: 150, fov: 75 },
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
    // TODO: 上流でテーマ設定する
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RepCounter
        currentCount={currentRepCount}
        targetCount={targetRepCount}
        style={{ position: 'absolute', top: '5vh', left: '5vh', zIndex: 2 }}
      />
      <div
        className="square-box"
        style={{
          zIndex: 2,
          position: 'absolute',
          width: '55vh',
          height: '55vh',
          top: '15vh',
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
      <Box
        sx={{
          position: 'absolute',
          left: '65%',
          top: '45%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        <Typography fontWeight="bold" variant="h5">
          {currentRepCount === 0 ? '' : 'しっかりしゃがんで'}
        </Typography>
        <Typography fontWeight="bold" variant="h3" sx={{ margin: '10px' }}>
          {currentRepCount === 0 ? '開始してください' : '強く立ち上がる'}
        </Typography>
      </Box>
      <Box sx={{ position: 'absolute', top: '100vh' }}>
        <canvas ref={canvasRef} className="dummy_canvas" width={640} height={720} hidden />
        {/* FIXME: The canvas element collapses without hard-coded width and height */}
        {/* The width and height above are the same to PreSetScene */}
      </Box>
    </ThemeProvider>
  );
}
