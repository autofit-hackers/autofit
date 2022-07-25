import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { evaluateForm, FormInstructionSettings } from '../coaching/formInstruction';
import { formInstructionItems } from '../coaching/formInstructionItems';
import { drawBarsWithAcceptableError } from '../drawing_utils/thresholdBar';
import {
  heightInFrame,
  kinectToMediapipe,
  KINECT_POSE_CONNECTIONS,
  normalizeWorldLandmarks,
  Pose,
} from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training/repState';
import { Set } from '../training/set';
import { startCaptureWebcam } from '../utils/capture';
import { renderBGRA32ColorFrame, sideRenderFrame } from '../utils/drawing';
import { startKinect } from '../utils/kinect';
import { kinectAtom, phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

export default function BodyTrack2d() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sideCanvasRef = useRef<HTMLCanvasElement>(null);

  const canvasImageData = useRef<ImageData | null>(null);

  // Phase
  const [, setPhase] = useAtom(phaseAtom);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  /*
   *セット・レップ・RepState変数
   */
  const [, setSetRecord] = useAtom(setRecordAtom);
  const set = useRef<Set>({ reps: [] });
  const rep = useRef<Rep>(resetRep());
  const repState = useRef<RepState>(resetRepState());

  // settings
  const lowerThreshold = 0.7; // TODO: temporarily hard coded => useContext(RepCountSettingContext).lowerThreshold;
  const upperThreshold = 0.9; // TODO: temporarily hard coded =>  useContext(RepCountSettingContext).upperThreshold;
  const formInstructionSettings: FormInstructionSettings = {
    items: formInstructionItems,
  };

  // 映像保存用
  const [, setRepVideoUrls] = useAtom(repVideoUrlsAtom);
  const canvasRecorderRef = useRef<MediaRecorder | null>(null);

  /*
   * 毎kinect更新時に回っている関数
   */
  const onResults = useCallback(
    (data: {
      colorImageFrame: { imageData: ImageData; width: number; height: number };
      bodyFrame: { bodies: any[] };
    }) => {
      if (canvasRef.current === null || sideCanvasRef.current === null) {
        throw new Error('canvasRef is null');
      }
      const canvasCtx = canvasRef.current.getContext('2d');
      const sideCanvasCtx = sideCanvasRef.current.getContext('2d');
      if (canvasCtx === null || sideCanvasCtx === null) {
        throw new Error('canvasCtx is null');
      }
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.width);

      if (canvasImageData.current === null) {
        canvasRef.current.width = data.colorImageFrame.width;
        canvasRef.current.height = data.colorImageFrame.height;
        canvasImageData.current = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
      } else {
        renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);
        sideRenderFrame(sideCanvasCtx, canvasImageData.current);
      }

      if (data.bodyFrame.bodies) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const currentPose: Pose = kinectToMediapipe(data.bodyFrame.bodies[0].skeleton.joints, canvasRef.current);

        // レップの最初のフレームの場合
        if (repState.current.isFirstFrameInRep) {
          // 動画撮影を開始
          canvasRecorderRef.current = startCaptureWebcam(canvasRef.current, setRepVideoUrls);

          // レップの最初の身長を記録
          repState.current = setStandingHeight(repState.current, heightInFrame(currentPose));

          // レップの開始フラグをoffにする
          repState.current.isFirstFrameInRep = false;
        }

        // フォームを分析し、レップの状態を更新する
        repState.current = checkIfRepFinish(
          repState.current,
          heightInFrame(currentPose),
          lowerThreshold,
          upperThreshold,
        );

        // 現フレームの推定Poseをレップのフォームに追加
        rep.current = appendPoseToForm(rep.current, currentPose);

        // レップが終了したとき
        if (repState.current.isRepEnd) {
          // 動画撮影を停止し、配列に保存する
          if (canvasRecorderRef.current) {
            canvasRecorderRef.current.stop();
          }

          // 完了したレップのフォームを分析・評価
          rep.current = calculateKeyframes(rep.current);
          rep.current = evaluateForm(rep.current, formInstructionSettings);

          // 完了したレップの情報をセットに追加し、レップをリセットする
          set.current.reps = [...set.current.reps, rep.current];
          rep.current = resetRep();

          // TODO: レップカウントを読み上げる
          // RepStateの初期化
          repState.current = resetRepState();
        }

        // pose estimationの結果を描画
        drawLandmarks(canvasCtx, currentPose.landmarks, {
          color: 'white',
          lineWidth: 4,
          radius: 8,
          fillColor: 'lightgreen',
        });
        drawConnectors(canvasCtx, currentPose.landmarks, KINECT_POSE_CONNECTIONS, {
          color: 'white',
          lineWidth: 4,
        });
        drawBarsWithAcceptableError(
          canvasCtx,
          currentPose.landmarks[10].x * canvasRef.current.width,
          currentPose.landmarks[10].y * canvasRef.current.height,
          currentPose.landmarks[17].x * canvasRef.current.width,
          currentPose.landmarks[17].y * canvasRef.current.height,
          canvasRef.current.width,
          100, // TODO: this is magic number, change value to evaluate form instruction function
        );
        // Side座標を描画
        drawLandmarks(sideCanvasCtx, normalizeWorldLandmarks(currentPose.worldLandmarks, sideCanvasRef.current), {
          color: 'white',
          lineWidth: 4,
          radius: 8,
          fillColor: 'lightgreen',
        });
        drawConnectors(
          sideCanvasCtx,
          normalizeWorldLandmarks(currentPose.worldLandmarks, sideCanvasRef.current),
          KINECT_POSE_CONNECTIONS,
          {
            color: 'white',
            lineWidth: 4,
          },
        );
      }
      // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
      if (set.current.reps.length === 100) {
        setSetRecord(set.current);
        setPhase(1);
      }

      // レップカウントを表示
      canvasCtx.fillText(set.current.reps.length.toString(), 50, 50);
      canvasCtx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /*
   * Kinectの開始
   */
  useEffect(() => {
    startKinect(kinect, onResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="main_canvas"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: 1280,
          height: 720,
        }}
      />
      <canvas
        ref={sideCanvasRef}
        className="side_canvas"
        width="1280"
        height="720"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 'auto',
          top: 720,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: 1280,
          height: 720,
        }}
      />
    </>
  );
}
