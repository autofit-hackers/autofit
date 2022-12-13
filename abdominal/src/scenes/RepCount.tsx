import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { getInterestJointsDistance, Pose, rotateWorldLandmarks } from '../utils/pose';
import { appendPoseToForm, calculateKeyframes, getTopPose, resetRep } from '../utils/rep';
import { checkIfRepFinish, resetRepState, setInterestJointsDistance } from '../utils/repState';
import { resetSet } from '../utils/set';

function RepCount() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 外れ値処理の設定
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 0.1, maxConsecutiveOutlierCount: 5 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlier = new FixOutlier(fixOutlierParams);
  const fixWorldOutlier = new FixOutlier(fixWorldOutlierPrams);

  // コンポーネントの再レンダリングを強制するためのstate
  const [, causeReRendering] = useState(0);

  // トレーニング記録
  const set = useRef(resetSet());
  const rep = useRef(resetRep(0));
  const repState = useRef(resetRepState());

  // 種目とカメラの設定
  const exerciseType: 'squat' | 'bench' = 'squat';
  const poseRotateAxis: 'x' | 'y' | 'z' = 'x';
  const poseRotateAngle = 0; // radians

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
      canvasCtx.font = '50px serif';

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      // このあとbeginPath()が必要らしい：https://developer.mozilla.org/ja/docs/Web/API/CanvasRenderingContext2D/clearRect
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if ('poseLandmarks' in results) {
        // mediapipeの推論結果を自作のPoseクラスに代入
        const rawCurrentPose: Pose = rotateWorldLandmarks(
          {
            landmarks: results.poseLandmarks,
            worldLandmarks: results.poseWorldLandmarks,
          },
          poseRotateAxis,
          poseRotateAngle,
        );

        // 外れ値処理
        const currentPose: Pose = rawCurrentPose;
        if (prevPoseRef.current != null) {
          const fixedLandmarks = fixOutlier.fixOutlierOfLandmarkList(
            prevPoseRef.current.landmarks,
            rawCurrentPose.landmarks,
          );
          currentPose.landmarks = fixedLandmarks;
          const fixedWorldLandmarks = fixWorldOutlier.fixOutlierOfLandmarkList(
            prevPoseRef.current.worldLandmarks,
            rawCurrentPose.worldLandmarks,
          );
          currentPose.worldLandmarks = fixedWorldLandmarks;
        }
        prevPoseRef.current = currentPose;

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

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // セットの最初の身長を記録
          if (set.current.reps.length === 0) {
            repState.current = setInterestJointsDistance(
              repState.current,
              getInterestJointsDistance(currentPose, exerciseType),
            );
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
        repState.current = checkIfRepFinish(
          repState.current,
          getInterestJointsDistance(currentPose, exerciseType),
          0.8,
          0.95,
        );

        // 現フレームの推定Poseをレップのフォームに追加
        rep.current = appendPoseToForm(rep.current, currentPose);

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          // 完了したレップのフォームを分析・評価
          rep.current = calculateKeyframes(rep.current);

          // 完了したレップの情報をセットに追加し、レップをリセットする
          set.current.reps = [...set.current.reps, rep.current];
          rep.current = resetRep(set.current.reps.length);

          console.log('rep count', set.current.reps.length);

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
      modelComplexity: 2,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    poseEstimator.onResults(onResults);

    if (webcamRef.current !== null && webcamRef.current.video !== null) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current === null || webcamRef.current.video === null) return;
          await poseEstimator.send({ image: webcamRef.current.video });
        },
        height: 720,
        width: 1280,
      });
      setTimeout(() => {
        void camera.start();
      }, 1000);
    }
  }, [onResults]);

  return (
    <>
      <Webcam ref={webcamRef} hidden />
      <canvas
        ref={canvasRef}
        className="output_canvas"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
        }}
      />
    </>
  );
}

export default RepCount;
