import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Button, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
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
import WebcamSelectButton from './WebcamSelectButton';

interface PoseEstimatorProps {
  doingExercise: boolean;
}

function PoseEstimator({ doingExercise }: PoseEstimatorProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  const distOfInterestJoints = useRef<number>(0);
  const [DistOfInterestJointsList, setDistOfInterestJointsList] = useState<number[]>([]);

  // 種目の設定
  const exercise: Exercise = 'squat';
  const menuRef = useRef('');
  const identifiedExerciseListRef = useRef<Exercise[]>([]);

  // カメラの設定
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [selectedWebcamId, setSelectedWebcamId] = useState('');

  // セットの開始終了フラグ
  const doingExerciseRef = useRef(false);
  doingExerciseRef.current = doingExercise;

  const onResults = useCallback(
    (results: Results) => {
      if (canvasRef.current === null) return;

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');

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

        const interestJointsDistance = getJointsDistanceForRepCount(currentPose, exercise);

        // 種目検出
        const identifiedExercise = identifyExercise(currentPose);
        // 最初の100フレームについて、検出を行う
        if (identifiedExercise !== undefined && identifiedExerciseListRef.current.length < 10) {
          identifiedExerciseListRef.current.push(identifiedExercise);
          menuRef.current = getMostFrequentExercise(identifiedExerciseListRef.current);
        }

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // セットの最初の身長を記録
          if (set.current.reps.length === 0) {
            repState.current = setJointsDistanceForRepCount(repState.current, interestJointsDistance);
          } else {
            const firstRepTopPose = getTopPose(set.current.reps[0]);
            if (firstRepTopPose !== undefined) {
              repState.current = setJointsDistanceForRepCount(repState.current, interestJointsDistance);
            }
          }
          // レップの開始フラグをoffにする
          repState.current.isFirstFrameInRep = false;
        }

        // フォームを分析し、レップの状態を更新する
        repState.current = checkIfRepFinish(repState.current, interestJointsDistance, exercise);

        // 現フレームの推定Poseをレップのフォームに追加
        rep.current = appendPoseToForm(rep.current, currentPose);

        // 挙上速度を計算しリストに追加
        distOfInterestJoints.current = getJointsDistanceForRepCount(currentPose, exercise);

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

  useEffect(() => {
    if (isWebcamOpen) {
      const poseEstimator = new PoseMediapipe({
        locateFile: (file) => `./public/mediapipe-pose/${file}`,
      });

      poseEstimator.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.8,
      });

      poseEstimator.onResults(onResults);

      if (webcamRef.current !== null && webcamRef.current.video !== null) {
        const camera = new Camera(webcamRef.current.video, {
          onFrame: async () => {
            if (webcamRef.current === null || webcamRef.current.video === null || canvasRef.current === null) return;
            const { videoWidth } = webcamRef.current.video;
            const { videoHeight } = webcamRef.current.video;
            canvasRef.current.width = videoHeight;
            canvasRef.current.height = videoWidth;
            const canvasCtx = canvasRef.current.getContext('2d');
            if (canvasCtx == null) return;
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            canvasCtx.save();
            canvasCtx.translate(canvasRef.current.width / 2, canvasRef.current.height / 2);
            canvasCtx.rotate(Math.PI / 2);
            canvasCtx.drawImage(webcamRef.current.video, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
            canvasCtx.restore();
            await poseEstimator.send({ image: canvasRef.current });
          },
          height: 1080,
          width: 1920,
        });
        setTimeout(() => {
          void camera.start();
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebcamOpen]);

  useEffect(() => {
    // グラフ更新用
    const chartUpdatingTimer = setInterval(() => {
      setDistOfInterestJointsList((prevList) => {
        prevList.push(distOfInterestJoints.current);

        return prevList;
      });
      causeReRendering((prev) => prev + 1);
    }, 10);

    return () => {
      clearInterval(chartUpdatingTimer);
    };
  }, []);

  return (
    <>
      {isWebcamOpen ? (
        <>
          <Webcam ref={webcamRef} videoConstraints={{ deviceId: selectedWebcamId }} hidden />
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
          <Button
            onClick={() => {
              setIsWebcamOpen(false);
            }}
          >
            Close Webcam
          </Button>
        </>
      ) : (
        <>
          <Button
            onClick={() => {
              setIsWebcamOpen(true);
            }}
          >
            Open Webcam
          </Button>
          <WebcamSelectButton selectedDeviceId={selectedWebcamId} setSelectedDeviceId={setSelectedWebcamId} />
        </>
      )}

      <Typography variant="h3" sx={{ position: 'fixed', right: '5vw', bottom: '37vh', zIndex: 9 }}>
        {menuRef.current}
      </Typography>
      <Typography variant="h3" sx={{ position: 'fixed', right: '5vw', bottom: '31vh', zIndex: 9 }}>
        Reps: {set.current.reps.length}
      </Typography>
      <RealtimeChart
        data={DistOfInterestJointsList}
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
