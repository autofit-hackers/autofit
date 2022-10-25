import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { shoulderPacking, stanceWidth, standingPosition } from '../coaching/squat/preSetGuide';
import { convertKinectResultsToPose, Pose } from '../training_data/pose';
import { resetRep } from '../training_data/rep';
import { resetRepState } from '../training_data/repState';
import { renderBGRA32ColorFrame } from '../utils/drawCanvas';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { getInterestBody, KinectBody, startKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/poseGrid';
import { kinectAtom, phaseAtom, setRecordAtom, settingsAtom } from './atoms';
import FadeInOut from './decorators/FadeInOut';
import { InSetProcess, InSetScene } from './InSetScene';
import { PreSetProcess, PreSetScene } from './PreSetScene';

export default function BodyTracking() {
  /*
  共通
  */

  // フェーズ
  const [, setPhase] = useAtom(phaseAtom);
  const scene = useRef<'PreSet' | 'InSet'>('PreSet');

  // Settings
  const [settings] = useAtom(settingsAtom);

  // 外れ値処理の設定
  // TODO: titration of outlier detection parameters
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 0.1, maxConsecutiveOutlierCount: 5 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlier = new FixOutlier(fixOutlierParams);
  const fixWorldOutlier = new FixOutlier(fixWorldOutlierPrams);

  // コンポーネントの再レンダリングを強制するためのstate
  const [, causeReRendering] = useState(0);

  // RGB描画
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);

  // 映像保存用
  const frontVideoRecorder = useRef<MediaRecorder | null>(null);
  const sideVideoRecorder = useRef<MediaRecorder | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Kinect
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  const interestBody = useRef<KinectBody>({ skeleton: undefined, id: -1 });

  /*
  PreSet
  */

  // ガイド項目とチェックボックス
  const guideItemCommonDefault = { isCleared: false, text: '' };
  const guideItems = useRef([
    { guide: standingPosition, name: 'standingPosition', ...guideItemCommonDefault, frameCountAfterUnchecked: 0 },
    { guide: stanceWidth, name: 'stanceWidth', ...guideItemCommonDefault, frameCountAfterUnchecked: 0 },
    // { guide: footAngle, name: 'footAngle', ...guideItemCommonDefault },
    { guide: shoulderPacking, name: 'shoulderPacking', ...guideItemCommonDefault, frameCountAfterUnchecked: 0 },
  ]);
  // if product mode => start with false
  const isAllGuideCleared = useRef(settings.isDebugMode);

  // タイマー
  const timerKey = useRef(0);

  // rack out
  // if product mode => start with false
  const hasRackedOut = useRef(settings.isDebugMode);
  const initialShoulderY = useRef(0);

  /*
  InSet
  */

  // poseGrid
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGrid = useRef<PoseGrid | null>(null);

  // トレーニングデータ
  const [setRecord, setSetRecord] = useAtom(setRecordAtom);
  const setRef = useRef(setRecord);
  const repRef = useRef(resetRep(0));
  const repState = useRef(resetRepState());

  // 目標レップ数
  const targetRepCount = setRecord.setInfo.targetReps;

  // 毎kinect更新時に実行される
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
      canvasCtx.clearRect(0, 0, data.colorImageFrame.height, data.colorImageFrame.height);

      if (canvasImageData.current === null) {
        canvasRef.current.width = data.colorImageFrame.width / 2; // 撮影映像の中央部分だけを描画するため、canvasの横幅を半分にする
        canvasRef.current.height = data.colorImageFrame.height;
        canvasImageData.current = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
      }
      renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);

      if (data.bodyFrame.bodies.length > 0) {
        interestBody.current = getInterestBody(data.bodyFrame.bodies, interestBody.current.id);

        // Kinectの姿勢推定結果を自作のPose型に代入
        const rawCurrentPose: Pose = convertKinectResultsToPose(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          interestBody.current.skeleton.joints,
          canvasRef.current,
          true,
          new Date().getTime(),
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

        if (scene.current === 'PreSet') {
          PreSetProcess(
            canvasCtx,
            currentPose,
            guideItems,
            isAllGuideCleared,
            causeReRendering,
            timerKey,
            hasRackedOut,
            initialShoulderY,
          );
        } else if (scene.current === 'InSet') {
          InSetProcess(
            canvasRef,
            poseGrid,
            currentPose,
            repState,
            setRef,
            repRef,
            settings.checkpoints,
            setSetRecord,
            causeReRendering,
            setPhase,
            targetRepCount,
            frontVideoRecorder,
            sideVideoRecorder,
            webcamRef,
          );
        }
      }
      // 姿勢推定結果が空の場合、
      else if (poseGrid.current) {
        // bodyIdをリセットする
        interestBody.current.id = -1;
        // poseGridのマウス操作だけ更新する
        poseGrid.current.updateOrbitControls();
      }

      // DISCUSS: いらないかも（repCount描画の名残り）
      canvasCtx.restore();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Kinectの開始
  useEffect(() => {
    window.log.debug('kinect is starting...');
    startKinect(kinect, onResults);
    // REF: ここでStopKinect呼べるかもしれない（https://blog.techscore.com/entry/2022/06/10/080000）
  }, [kinect, onResults]);

  return (
    <div>
      <div hidden>
        <Webcam
          ref={webcamRef}
          videoConstraints={{
            facingMode: 'user',
          }}
        />
      </div>
      {(scene.current === 'PreSet' && (
        // PreSetScene do not need <FadeInOut></FadeInOut> decorator
        <PreSetScene
          canvasRef={canvasRef}
          guideItems={guideItems}
          timerKey={timerKey}
          isAllGuideCleared={isAllGuideCleared}
          scene={scene}
          causeReRendering={causeReRendering}
          hasRackedOut={hasRackedOut}
        />
      )) ||
        (scene.current === 'InSet' && (
          <FadeInOut>
            <InSetScene
              currentRepCount={setRef.current.reps.length}
              targetRepCount={targetRepCount}
              canvasRef={canvasRef}
              gridDivRef={gridDivRef}
              poseGrid={poseGrid}
            />
          </FadeInOut>
        ))}
    </div>
  );
}
