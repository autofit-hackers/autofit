/* eslint-disable no-param-reassign */
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Options, Pose as PoseMediapipe, POSE_CONNECTIONS, Results } from '@mediapipe/pose';
import { Pose, rotateWorldLandmarks, getJointsDistanceForRepCount } from '../../utils/pose';
import { getTopPose, appendPoseToForm, calculateKeyframes, resetRep, Rep } from '../../utils/rep';
import { setJointsDistanceForRepCount, checkIfRepFinish, resetRepState, RepState } from '../../utils/repState';
import { Set } from '../../utils/set';
import { Exercise } from '../../utils/Exercise';

export const loadPoseEstimator = (options: Options, onResults: (results: Results) => void): PoseMediapipe => {
  const poseEstimator = new PoseMediapipe({
    locateFile: (file) => `./public/mediapipe-pose/${file}`,
  });
  poseEstimator.setOptions(options);
  poseEstimator.onResults(onResults);

  return poseEstimator;
};

export const sendFrameToPoseEstimator = async (poseEstimator: PoseMediapipe, canvas: HTMLCanvasElement) => {
  if (poseEstimator === null || canvas === null) return;
  await poseEstimator.send({ image: canvas });
};

export const drawPose = (canvas: HTMLCanvasElement | null, results: Results, color: string) => {
  if (canvas === null || results === null) return;

  const ctx = canvas.getContext('2d');
  if (ctx === null) return;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: 'white',
      lineWidth: 2,
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: 'white',
      lineWidth: 4,
      radius: 8,
      fillColor: color,
    });
  }
  ctx.restore();
};

export const updateTrainingStates = (results: Results, repState: RepState, rep: Rep, set: Set, exercise: Exercise) => {
  if ('poseLandmarks' in results) {
    // mediapipeの推論結果を自作のPoseクラスに代入
    const currentPose: Pose = {
      landmarks: results.poseLandmarks,
      worldLandmarks: rotateWorldLandmarks(results.poseWorldLandmarks, { roll: 180, pitch: 0, yaw: 0 }),
      timestamp: new Date().getTime(),
    };

    const jointsDistanceForRepCount = getJointsDistanceForRepCount(currentPose, exercise);

    // レップの最初のフレームの場合
    if (repState.isFirstFrameInRep) {
      // セットの最初の身長を記録
      if (set.reps.length === 0) {
        repState = setJointsDistanceForRepCount(repState, jointsDistanceForRepCount);
      } else {
        const firstRepTopPose = getTopPose(set.reps[0]);
        if (firstRepTopPose != null) {
          repState = setJointsDistanceForRepCount(repState, jointsDistanceForRepCount);
        }
      }
      // レップの開始フラグをoffにする
      repState.isFirstFrameInRep = false;
    }

    // フォームを分析し、レップの状態を更新する
    repState = checkIfRepFinish(repState, jointsDistanceForRepCount, exercise);

    // 現フレームの推定Poseをレップのフォームに追加
    rep = appendPoseToForm(rep, currentPose);

    // レップが終了したとき
    if (repState.isRepEnd) {
      // 完了したレップのフォームを分析・評価
      rep = calculateKeyframes(rep, exercise);

      // 完了したレップの情報をセットに追加し、レップをリセットする
      set.reps = [...set.reps, rep];
      rep = resetRep(set.reps.length);

      // RepStateの初期化
      repState = resetRepState();
    }
  }
};
