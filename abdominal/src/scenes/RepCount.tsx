import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Box, Grid } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import RealtimeChart from '../components/RealtimeChart';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { getInterestJointsDistance, getLiftingVelocity, Pose } from '../utils/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, resetRep } from '../utils/rep';
import { checkIfRepFinish, resetRepState, setInterestJointsDistance } from '../utils/repState';
import { resetSet } from '../utils/set';

function RepCount() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputCanvasRef = useRef<HTMLCanvasElement>(null);

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
  const liftingVelocityList: number[] = [];
  const [data, setData] = useState<number[]>([]);

  // 種目とカメラの設定
  const exerciseType: 'squat' | 'bench' = 'squat';

  const onResults = useCallback(
    (results: Results) => {
      if (canvasRef.current === null || webcamRef.current === null || webcamRef.current.video === null) {
        return;
      }
      const { videoWidth, videoHeight } = webcamRef.current.video;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext('2d');

      if (canvasCtx == null) {
        return;
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.scale(-1, 1);
      canvasCtx.rotate(Math.PI / 2);
      // このあとbeginPath()が必要らしい：https://developer.mozilla.org/ja/docs/Web/API/CanvasRenderingContext2D/clearRect
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if ('poseLandmarks' in results) {
        // mediapipeの推論結果を自作のPoseクラスに代入
        const rawCurrentPose: Pose = {
          landmarks: results.poseLandmarks,
          worldLandmarks: results.poseWorldLandmarks,
          timestamp: new Date().getTime(),
        };

        console.log(rawCurrentPose.landmarks[0].x);

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
        prevPose.current = currentPose;

        // pose estimationの結果を描画
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

        const interestJointsDistance = getInterestJointsDistance(currentPose, exerciseType);
        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // セットの最初の身長を記録
          if (set.current.reps.length === 0) {
            repState.current = setInterestJointsDistance(repState.current, interestJointsDistance);
          } else {
            const firstRepTopPose = getTopPose(set.current.reps[0]);
            if (firstRepTopPose !== undefined) {
              repState.current = setInterestJointsDistance(
                repState.current,
                getInterestJointsDistance(firstRepTopPose, exerciseType),
              );
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
        const liftingVelocity = prevPose.current ? getLiftingVelocity(prevPose.current, currentPose, exerciseType) : 0;
        liftingVelocityList.push(liftingVelocity);

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
      }

      canvasCtx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const poseEstimator = new PoseMediapipe({
      locateFile: (file) => `./public/mediapipe-pose/${file}`,
    });

    poseEstimator.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.8,
    });

    poseEstimator.onResults(onResults);

    if (webcamRef.current !== null && webcamRef.current.video !== null) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current === null || webcamRef.current.video === null || inputCanvasRef.current === null)
            return;
          const { videoWidth } = webcamRef.current.video;
          const { videoHeight } = webcamRef.current.video;
          inputCanvasRef.current.width = videoWidth;
          inputCanvasRef.current.height = videoHeight;
          const inputCanvasCtx = inputCanvasRef.current.getContext('2d');
          if (inputCanvasCtx == null) return;
          inputCanvasCtx.save();
          inputCanvasCtx.clearRect(0, 0, inputCanvasRef.current.width, inputCanvasRef.current.height);
          inputCanvasCtx.scale(-1, 1);
          inputCanvasCtx.rotate(90 * (Math.PI / 180));
          inputCanvasCtx.drawImage(
            webcamRef.current.video,
            0,
            0,
            inputCanvasRef.current.width,
            inputCanvasRef.current.height,
          );
          inputCanvasCtx.restore();
          await poseEstimator.send({ image: webcamRef.current.video });
        },
        height: 720,
        width: 1280,
      });
      setTimeout(() => {
        void camera.start();
      }, 1000);
    }

    // グラフ更新用
    const chartUpdatingTimer = setInterval(() => {
      setData(liftingVelocityList);
    }, 100);

    return () => {
      clearInterval(chartUpdatingTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Webcam ref={webcamRef} videoConstraints={{ facingMode: 'environment' }} hidden />
      <canvas ref={inputCanvasRef} className="rotated_canvas" hidden />
      <Grid container spacing={0}>
        <Grid item xs={6}>
          <canvas
            ref={canvasRef}
            className="output_canvas"
            style={{
              textAlign: 'center',
              left: '0',
              scale: '0.8',
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <RealtimeChart data={data} style={{ height: '50vh', width: '50vw' }} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default RepCount;
