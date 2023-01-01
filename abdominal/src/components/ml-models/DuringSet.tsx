import { Pose as PoseMediapipe, Results } from '@mediapipe/pose';
import { Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Exercise } from '../../utils/exercise';
import {
  getJointsDistanceForRepCount,
  getMostFrequentExercise,
  identifyExercise,
  Pose,
  rotateWorldLandmarks,
} from '../../utils/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, resetRep } from '../../utils/rep';
import { checkIfRepFinish, resetRepState, setJointsDistanceForRepCount } from '../../utils/repState';
import { resetSet } from '../../utils/set';
import WebcamAF from '../camera/WebcamAF';
import RealtimeChart from '../RealtimeChart';

type PoseEstimatorProps = {
  doingExercise: boolean;
  displayGraph: boolean;
};

function PoseEstimator(props: PoseEstimatorProps) {
  const { doingExercise, displayGraph } = props;
  // カメラとcanvasの設定
  const poseCanvasRef = useRef<HTMLCanvasElement>(null);

  // 外れ値処理の設定
  const prevPose = useRef<Pose | null>(null);

  // コンポーネントの再レンダリングを強制するためのstate
  const [, causeReRendering] = useState(0);

  // トレーニング記録
  const set = useRef(resetSet());
  const rep = useRef(resetRep(0));
  const repState = useRef(resetRepState());

  // リアルタイムグラフ
  const distanceOfInterestJoints = useRef<number>(0);
  const [distanceOfInterestJointsList, setDistanceOfInterestJointsList] = useState<number[]>([]);
  const graphLength = 300;

  // 種目の設定
  const exercise: Exercise = 'squat';
  const menuRef = useRef('');
  const identifiedExerciseListRef = useRef<Exercise[]>([]);

  // セットの開始終了フラグ
  const doingExerciseRef = useRef(false);
  doingExerciseRef.current = doingExercise;

  const poseEstimator = useRef<PoseMediapipe | null>(null);

  const onResults = useCallback(
    (results: Results) => {
      if ('poseLandmarks' in results) {
        // mediapipeの推論結果を自作のPoseクラスに代入
        const rawCurrentPose: Pose = {
          landmarks: results.poseLandmarks,
          worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
          timestamp: new Date().getTime(),
        };

        // 外れ値処理
        const currentPose: Pose = rawCurrentPose;

        // WARN: レスト中なら処理を中断。動作未確認
        if (doingExerciseRef.current === false) return;

        const jointsDistanceForRepCount = getJointsDistanceForRepCount(currentPose, exercise);

        // 種目検出
        const identifiedExercise = identifyExercise(currentPose);
        // 最初の100フレームについて、検出を行う
        if (identifiedExercise != null && identifiedExerciseListRef.current.length < 100) {
          identifiedExerciseListRef.current.push(identifiedExercise);
          menuRef.current = getMostFrequentExercise(identifiedExerciseListRef.current);
        }

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // セットの最初の身長を記録
          if (set.current.reps.length === 0) {
            repState.current = setJointsDistanceForRepCount(repState.current, jointsDistanceForRepCount);
          } else {
            const firstRepTopPose = getTopPose(set.current.reps[0]);
            if (firstRepTopPose != null) {
              repState.current = setJointsDistanceForRepCount(repState.current, jointsDistanceForRepCount);
            }
          }
          // レップの開始フラグをoffにする
          repState.current.isFirstFrameInRep = false;
        }

        // フォームを分析し、レップの状態を更新する
        repState.current = checkIfRepFinish(repState.current, jointsDistanceForRepCount, exercise);

        // 現フレームの推定Poseをレップのフォームに追加
        rep.current = appendPoseToForm(rep.current, currentPose);

        // 挙上速度を計算しリストに追加
        distanceOfInterestJoints.current = getJointsDistanceForRepCount(currentPose, exercise);

        // レップが終了したとき
        if (repState.current.isRepEnd && doingExerciseRef.current) {
          // 完了したレップのフォームを分析・評価
          rep.current = calculateKeyframes(rep.current, exercise);

          // 完了したレップの情報をセットに追加し、レップをリセットする
          set.current.reps = [...set.current.reps, rep.current];
          rep.current = resetRep(set.current.reps.length);

          // RepStateの初期化
          repState.current = resetRepState();

          // レップカウント更新のため再レンダリングさせる
          causeReRendering((prev) => prev + 1);
        }
        prevPose.current = currentPose;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doingExercise],
  );

  // mediapipeの初期化
  useEffect(() => {
    poseEstimator.current = new PoseMediapipe({
      locateFile: (file) => `./public/mediapipe-pose/${file}`,
    });

    poseEstimator.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.3,
      minTrackingConfidence: 0.8,
    });

    poseEstimator.current.onResults(onResults);
  }, [onResults]);

  const estimatePose = useCallback(async (canvas: HTMLCanvasElement) => {
    if (poseEstimator.current === null || canvas === null) return;
    await poseEstimator.current.send({ image: canvas });
  }, []);

  // グラフ更新
  useEffect(() => {
    const chartUpdatingTimer = setInterval(() => {
      if (doingExerciseRef.current) {
        setDistanceOfInterestJointsList((prevList) => {
          prevList.push(distanceOfInterestJoints.current);

          return prevList.slice(-graphLength);
        });
        causeReRendering((prev) => prev + 1);
      }
    }, 10);

    return () => {
      clearInterval(chartUpdatingTimer);
    };
  }, []);

  return (
    <>
      <div style={{ position: 'relative' }}>
        <WebcamAF
          onFrame={estimatePose}
          inputWidth={720}
          inputHeight={480}
          rotation="left"
          style={{
            zIndex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        <canvas
          ref={poseCanvasRef}
          style={{
            zIndex: 2,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
      <Typography variant="h3" sx={{ position: 'fixed', right: '5vw', bottom: '37vh', zIndex: 2 }}>
        menu: {menuRef.current}
      </Typography>
      <Typography variant="h3" sx={{ position: 'fixed', right: '5vw', bottom: '31vh', zIndex: 2 }}>
        Reps: {set.current.reps.length}
      </Typography>
      {displayGraph && (
        <RealtimeChart
          data={distanceOfInterestJointsList}
          style={{
            position: 'fixed',
            height: '30vh',
            width: '30vw',
            left: '69vw',
            top: '69vh',
            backgroundColor: 'white',
            borderRadius: '10px',
            zIndex: 2,
          }}
        />
      )}
    </>
  );
}

export default PoseEstimator;
