import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Box, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { getInterestJointPosition, getInterestJointsDistance, Pose } from '../utils/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, resetRep } from '../utils/rep';
import { checkIfRepFinish, resetRepState, setInterestJointsDistance } from '../utils/repState';
import { resetSet } from '../utils/set';
import RealtimeChart from './RealtimeChart';

function RepCount() {
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

  // 種目とカメラの設定
  const exerciseType: 'squat' | 'bench' = 'squat';

  const onResults = useCallback(
    (results: Results) => {
      if (canvasRef.current === null || canvasRef.current === null) return;

      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');

      if (canvasCtx == null) return;

      if ('poseLandmarks' in results) {
        // mediapipeの推論結果を自作のPoseクラスに代入
        const rawCurrentPose: Pose = {
          landmarks: results.poseLandmarks,
          worldLandmarks: results.poseWorldLandmarks,
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

        const interestJointsDistance = getInterestJointsDistance(currentPose, exerciseType);

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // セットの最初の身長を記録
          if (set.current.reps.length === 0) {
            repState.current = setInterestJointsDistance(repState.current, interestJointsDistance);
          } else {
            const firstRepTopPose = getTopPose(set.current.reps[0]);
            if (firstRepTopPose !== undefined) {
              repState.current = setInterestJointsDistance(repState.current, interestJointsDistance);
            }
          }
          // レップの開始フラグをoffにする
          repState.current.isFirstFrameInRep = false;
        }

        // フォームを分析し、レップの状態を更新する
        repState.current = checkIfRepFinish(repState.current, interestJointsDistance, 0.8, 0.95);

        // 現フレームの推定Poseをレップのフォームに追加
        rep.current = appendPoseToForm(rep.current, currentPose);

        // 挙上速度を計算しリストに追加
        distOfInterestJoints.current = getInterestJointPosition(currentPose, exerciseType);

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          // 完了したレップのフォームを分析・評価
          rep.current = calculateKeyframes(rep.current, exerciseType);

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
    [],
  );

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <Box>
      <Webcam ref={webcamRef} videoConstraints={{ facingMode: { exact: 'environment' } }} hidden />
      <Typography variant="h1" sx={{}}>
        {set.current.reps.length}
      </Typography>
      <canvas
        ref={canvasRef}
        className="output_canvas"
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          scale: '0.4',
        }}
      />
      <RealtimeChart
        data={DistOfInterestJointsList}
        style={{ position: 'absolute', top: '30vw', left: '30vh', height: '50vh', width: '50vw' }}
      />
    </Box>
  );
}

export default RepCount;
