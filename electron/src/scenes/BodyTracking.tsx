import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { evaluateForm, FormInstructionSettings } from '../coaching/formInstruction';
import { formInstructionItems } from '../coaching/formInstructionItems';
import { heightInFrame, kinectToMediapipe, KINECT_POSE_CONNECTIONS, Pose } from '../training/pose';
import { appendPoseToForm, calculateKeyframes, Rep, resetRep } from '../training/rep';
import { checkIfRepFinish, RepState, resetRepState, setStandingHeight } from '../training/repState';
import { Set } from '../training/set';
import { startCaptureWebcam } from '../utils/capture';
import { startKinect } from '../utils/kinect';
import { renderBGRA32ColorFrame } from '../utils/render/drawing';
import { LandmarkGrid } from '../utils/render/landmarkGrid';
import { kinectAtom, phaseAtom, repVideoUrlsAtom, setRecordAtom } from './atoms';

export default function BodyTrack2d() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  let landmarkGrid: LandmarkGrid;

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
   * 毎kinect更新時に実行される
   */
  const onResults = useCallback(
    (data: {
      colorImageFrame: { imageData: ImageData; width: number; height: number };
      bodyFrame: { bodies: any[] };
    }) => {
      if (canvasRef.current === null) {
        throw new Error('canvasRef is null');
      }
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx === null) {
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
      }

      if (data.bodyFrame.bodies) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        const currentPose: Pose = kinectToMediapipe(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          data.bodyFrame.bodies[0].skeleton.joints,
          canvasRef.current,
          true,
        );

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

          // 動画撮影を停止し、配列に保存する
          if (canvasRecorderRef.current) {
            canvasRecorderRef.current.stop();
          }

          // 完了したレップのフォームを分析・評価
          rep.current = calculateKeyframes(rep.current);
          rep.current = evaluateForm(rep.current, formInstructionSettings);

          console.log(rep.current.formEvaluationScores);

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

        // LandmarkGridの描画
        if (landmarkGrid) {
          landmarkGrid.updateLandmarks(currentPose.worldLandmarks, KINECT_POSE_CONNECTIONS);
        }
      }

      // RepCountが一定値に達するとsetの情報を記録した後、phaseを更新しセットレポートへ移動する
      if (set.current.reps.length === 100) {
        setSetRecord(set.current);
        setPhase(1);
      }

      // レップカウントを表示
      canvasCtx.fillText(set.current.reps.length.toString(), 50, 50);
      canvasCtx.scale(0.5, 0.5);
      canvasCtx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /*
   * Kinectの開始とLandmarkGridのセットアップ
   */
  useEffect(() => {
    startKinect(kinect, onResults);
    if (!landmarkGrid && gridDivRef.current !== null) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      landmarkGrid = new LandmarkGrid(gridDivRef.current);
      landmarkGrid.setCamera(90, 0, 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          width: 'auto',
          height: 'auto',
        }}
      />
      <div
        className="square-box"
        style={{
          zIndex: 2,
          position: 'absolute',
          width: '30vw',
          height: '30vw',
        }}
      >
        <div
          className="landmark-grid-container"
          ref={gridDivRef}
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </>
  );
}
