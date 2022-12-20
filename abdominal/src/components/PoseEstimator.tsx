import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Exercise } from '../utils/Exercise';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import {
  getJointsDistanceForRepCount,
  getMostFrequentExercise,
  identifyExercise,
  Pose,
  rotateWorldLandmarks,
} from '../utils/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, resetRep } from '../utils/rep';
import { checkIfRepFinish, resetRepState, setJointsDistanceForRepCount } from '../utils/repState';
import { resetSet } from '../utils/set';
import RealtimeChart from './RealtimeChart';
import WebcamOpenButton from './yolov5/components/WebcamOpenButton';

interface PoseEstimatorProps {
  doingExercise: boolean;
}

function PoseEstimator({ doingExercise }: PoseEstimatorProps) {
  // 外れ値処理の設定
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 0.1, maxConsecutiveOutlierCount: 5 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };
  const prevPose = useRef<Pose | null>(null);
  const fixOutlier = new FixOutlier(fixOutlierParams);
  const fixWorldOutlier = new FixOutlier(fixWorldOutlierPrams);

  // コンポーネントの再レンダリングを強制するためのstate
  const [, causeReRendering] = useState(0);

  // トレーニング記録
  const set = useRef(resetSet());
  const rep = useRef(resetRep(0));
  const repState = useRef(resetRepState());

  // リアルタイムグラフ
  const distanceOfInterestJoints = useRef<number>(0);
  const [distanceOfInterestJointsList, setDistanceOfInterestJointsList] = useState<number[]>([]);

  // 種目の設定
  const exercise: Exercise = 'squat';
  const menuRef = useRef('');
  const identifiedExerciseListRef = useRef<Exercise[]>([]);

  // カメラの設定
  const webcamRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // セットの開始終了フラグ
  const doingExerciseRef = useRef(false);
  doingExerciseRef.current = doingExercise;

  const poseEstimator = useRef<PoseMediapipe | null>(null);

  const onResults = useCallback(
    (results: Results) => {
      console.log('onResults');
      if (canvasRef.current === null) return;

      const canvasCtx = canvasRef.current.getContext('2d');

      if (canvasCtx == null) return;

      if ('poseLandmarks' in results) {
        // mediapipeの推論結果を自作のPoseクラスに代入
        const rawCurrentPose: Pose = {
          landmarks: results.poseLandmarks,
          worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
          timestamp: new Date().getTime(),
        };

        // 外れ値処理
        const currentPose: Pose = rawCurrentPose;
        if (prevPose.current != null) {
          const fixedLandmarks = fixOutlier.fixOutlierOfLandmarkList(
            prevPose.current.landmarks,
            rawCurrentPose.landmarks,
          );
          currentPose.landmarks = fixedLandmarks;
          const fixedWorldLandmarks = fixWorldOutlier.fixOutlierOfLandmarkList(
            prevPose.current.worldLandmarks,
            rawCurrentPose.worldLandmarks,
          );
          currentPose.worldLandmarks = fixedWorldLandmarks;
        }

        // pose estimationの結果を描画
        canvasCtx.save();
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
        canvasCtx.restore();

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

  // ビデオの初期化
  const onWebcamReady = useCallback(() => {
    console.log('webcam ready');
    if (webcamRef.current === null) {
      console.log('null');

      return;
    }
    const camera = new Camera(webcamRef.current, {
      onFrame: async () => {
        console.log('onFrame');
        if (webcamRef.current == null || canvasRef.current == null || poseEstimator.current === null) return;
        const { videoWidth } = webcamRef.current;
        const { videoHeight } = webcamRef.current;
        canvasRef.current.width = videoHeight;
        canvasRef.current.height = videoWidth;
        const canvasCtx = canvasRef.current.getContext('2d');
        if (canvasCtx == null) return;
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.save();
        canvasCtx.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
        canvasCtx.rotate(Math.PI / 2);
        canvasCtx.drawImage(webcamRef.current, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
        canvasCtx.restore();
        await poseEstimator.current.send({ image: canvasRef.current });
      },
      height: 1080,
      width: 1920,
    });
    console.log('camera start');
    void camera.start();
  }, []);

  // グラフ更新
  useEffect(() => {
    const chartUpdatingTimer = setInterval(() => {
      if (doingExerciseRef.current) {
        setDistanceOfInterestJointsList((prevList) => {
          prevList.push(distanceOfInterestJoints.current);

          return prevList;
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
      <video
        ref={webcamRef}
        autoPlay
        playsInline
        muted
        onCanPlay={onWebcamReady}
        hidden
        style={{ display: 'none', visibility: 'hidden' }}
      />
      <canvas
        ref={canvasRef}
        className="output_canvas"
        style={{
          position: 'relative',
          maxWidth: '500px',
          maxHeight: '720px',
          zIndex: 5,
        }}
      />
      <WebcamOpenButton cameraRef={webcamRef} />
      <Typography variant="h3" sx={{ position: 'fixed', right: '5vw', bottom: '37vh', zIndex: 9 }}>
        menu: {menuRef.current}
      </Typography>
      <Typography variant="h3" sx={{ position: 'fixed', right: '5vw', bottom: '31vh', zIndex: 9 }}>
        Reps: {set.current.reps.length}
      </Typography>
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
          zIndex: 9,
        }}
      />
    </>
  );
}

export default PoseEstimator;
