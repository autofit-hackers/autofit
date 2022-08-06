import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { evaluateForm, FormInstructionSettings } from '../coaching/formInstruction';
import { formInstructionItems } from '../coaching/formInstructionItems';
import {
  heightInFrame,
  kinectToMediapipe,
  KINECT_POSE_CONNECTIONS,
  normalizeAboveWorldLandmarks,
  normalizeFrontWorldLandmarks,
  normalizeSideWorldLandmarks,
  Pose,
} from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training/repState';
import { Set } from '../training/set';
import {
  showLineToCheckBackBent,
  showLineToCheckKneeInOut,
  showLineToCheckSquatDepth,
  showTextToCheckBackBent,
  showTextToCheckKneeInOut,
} from '../training/squatDebugging';
import { startCaptureWebcam } from '../utils/capture';
import { renderAboveFrame, renderBGRA32ColorFrame, renderFrontFrame, renderSideFrame } from '../utils/drawing';
import { startKinect } from '../utils/kinect';
import { kinectAtom, phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

export default function BodyTrack2d() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sideCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const aboveCanvasRef = useRef<HTMLCanvasElement>(null);
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
  const lowerThreshold = 0.8; // TODO: temporarily hard coded => useContext(RepCountSettingContext).lowerThreshold;
  const upperThreshold = 0.9; // TODO: temporarily hard coded => useContext(RepCountSettingContext).upperThreshold;
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
      if (
        canvasRef.current == null ||
        sideCanvasRef.current == null ||
        frontCanvasRef.current == null ||
        aboveCanvasRef.current == null
      ) {
        throw new Error('Either canvasRef or sideCanvasRef or frontCanvasRef or aboveCanvasRef is null');
      }
      const canvasCtx = canvasRef.current.getContext('2d');
      const sideCanvasCtx = sideCanvasRef.current.getContext('2d');
      const frontCanvasCtx = frontCanvasRef.current.getContext('2d');
      const aboveCanvasCtx = aboveCanvasRef.current.getContext('2d');
      if (canvasCtx == null || sideCanvasCtx == null || frontCanvasCtx == null || aboveCanvasCtx == null) {
        throw new Error('Either canvasCtx or sideCanvasCtx or frontCanvasCtx or aboveCanvasRef is null');
      }
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.width);

      if (canvasImageData.current === null) {
        canvasRef.current.width = data.colorImageFrame.width;
        canvasRef.current.height = data.colorImageFrame.height;
        sideCanvasRef.current.width = data.colorImageFrame.width;
        sideCanvasRef.current.height = data.colorImageFrame.height;
        frontCanvasRef.current.width = data.colorImageFrame.width;
        frontCanvasRef.current.height = data.colorImageFrame.height;
        aboveCanvasRef.current.width = data.colorImageFrame.width;
        aboveCanvasRef.current.height = data.colorImageFrame.height;
        canvasImageData.current = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
      } else {
        renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        renderSideFrame(sideCanvasCtx, canvasImageData.current);
        renderFrontFrame(frontCanvasCtx, canvasImageData.current);
        renderAboveFrame(aboveCanvasCtx, canvasImageData.current);
      }

      if (data.bodyFrame.bodies) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        const currentPose: Pose = kinectToMediapipe(data.bodyFrame.bodies[0].skeleton.joints, canvasRef.current, true);

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
          console.log('rep end');

          // TODO: 動画撮影を停止し、配列に保存する

          // 完了したレップのフォームを分析・評価
          rep.current = calculateKeyframes(rep.current);
          rep.current = evaluateForm(rep.current, formInstructionSettings);

          console.log(rep.current.formEvaluationScores);

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

        // Side座標を描画
        drawLandmarks(sideCanvasCtx, normalizeSideWorldLandmarks(currentPose.worldLandmarks, sideCanvasRef.current), {
          color: 'white',
          lineWidth: 4,
          radius: 8,
          fillColor: 'lightgreen',
        });
        drawConnectors(
          sideCanvasCtx,
          normalizeSideWorldLandmarks(currentPose.worldLandmarks, sideCanvasRef.current),
          KINECT_POSE_CONNECTIONS,
          {
            color: 'white',
            lineWidth: 4,
          },
        );
        // Front座標を描画
        drawLandmarks(
          frontCanvasCtx,
          normalizeFrontWorldLandmarks(currentPose.worldLandmarks, frontCanvasRef.current),
          {
            color: 'white',
            lineWidth: 4,
            radius: 8,
            fillColor: 'lightgreen',
          },
        );
        drawConnectors(
          frontCanvasCtx,
          normalizeFrontWorldLandmarks(currentPose.worldLandmarks, frontCanvasRef.current),
          KINECT_POSE_CONNECTIONS,
          {
            color: 'white',
            lineWidth: 4,
          },
        );
        // Above座標を描画
        drawLandmarks(
          aboveCanvasCtx,
          normalizeAboveWorldLandmarks(currentPose.worldLandmarks, aboveCanvasRef.current),
          {
            color: 'white',
            lineWidth: 4,
            radius: 8,
            fillColor: 'lightgreen',
          },
        );
        drawConnectors(
          aboveCanvasCtx,
          normalizeAboveWorldLandmarks(currentPose.worldLandmarks, aboveCanvasRef.current),
          KINECT_POSE_CONNECTIONS,
          {
            color: 'white',
            lineWidth: 4,
          },
        );

        // デバック用
        // TODO デバック用コードを削除
        // スクワットの腰の高さの検証用判定基準を表示
        showLineToCheckSquatDepth(
          sideCanvasCtx,
          sideCanvasRef.current,
          sideCanvasRef.current.width,
          sideCanvasRef.current.height,
          currentPose.worldLandmarks,
        );
        // スクワットの腰の高さを判定するためのデータを描画する
        // showTextToCheckSquatDepth(
        //   canvasCtx,
        //   canvasRef.current.width,
        //   canvasRef.current.height,
        //   currentPose.worldLandmarks,
        // );
        // showTextToCheckSquatDepth(
        //   sideCanvasCtx,
        //   canvasRef.current.width,
        //   canvasRef.current.height,
        //   currentPose.worldLandmarks,
        // );
        // スクワットのニーイン，ニーアウトの検証用判定基準を表示
        showLineToCheckKneeInOut(
          aboveCanvasCtx,
          aboveCanvasRef.current,
          aboveCanvasRef.current.width,
          aboveCanvasRef.current.height,
          currentPose.worldLandmarks,
        );
        // ニーイン，ニーアウトを判定するためのデータを描画する
        showTextToCheckKneeInOut(
          canvasCtx,
          canvasRef.current.width,
          canvasRef.current.height,
          currentPose.worldLandmarks,
        );
        // スクワットの背中が曲がっていないかの検証用判定基準を表示
        showLineToCheckBackBent(
          sideCanvasCtx,
          sideCanvasRef.current,
          sideCanvasRef.current.width,
          sideCanvasRef.current.height,
          currentPose.worldLandmarks,
        );
        // スクワットの背中が曲がっていないか判定するためのデータを表示
        showTextToCheckBackBent(
          canvasCtx,
          canvasRef.current.width,
          canvasRef.current.height,
          currentPose.worldLandmarks,
        );

        // TODO スクワットの踵とつま先の高さを判定するためのデータを描画する
        // squatFeetGroundCheckText(
        //   canvasCtx,
        //   canvasRef.current.width,
        //   canvasRef.current.height,
        //   currentPose.worldLandmarks,
        // );
        // squatFeetGroundCheckText(
        //   frontCanvasCtx,
        //   canvasRef.current.width,
        //   canvasRef.current.height,
        //   currentPose.worldLandmarks,
        // );
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

  // TODO: front映像の上にabove映像をかぶせているので，かぶらないように配置する

  return (
    <>
      <canvas
        ref={canvasRef}
        className="main_canvas"
        style={{
          position: 'absolute',
          marginLeft: 0,
          marginRight: 'auto',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: '64vw',
          height: '36vw',
        }}
      />
      <canvas
        ref={sideCanvasRef}
        className="side_canvas"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 0,
          top: 0,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: '72vh',
          height: '45vh',
        }}
      />
      <canvas
        ref={frontCanvasRef}
        className="front_canvas"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 0,
          top: '50vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: '72vh',
          height: '45vh',
        }}
      />
      <canvas
        ref={aboveCanvasRef}
        className="above_canvas"
        style={{
          position: 'absolute',
          marginLeft: 'auto',
          marginRight: 0,
          top: '50vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 1,
          width: '72vh',
          height: '45vh',
        }}
      />
    </>
  );
}
