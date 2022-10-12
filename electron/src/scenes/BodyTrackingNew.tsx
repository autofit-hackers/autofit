import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { shoulderPacking, stanceWidth, standingPosition } from '../coaching/squat-form-instructions/preSetGuide';
import { convertKinectResultsToPose, Pose } from '../training_data/pose';
import { resetRep } from '../training_data/rep';
import { resetRepState } from '../training_data/repState';
import { resetSet } from '../training_data/set';
import { renderBGRA32ColorFrame } from '../utils/drawCanvas';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { startKinect } from '../utils/kinect';
import { PoseGrid } from '../utils/poseGrid';
import { formInstructionItemsAtom, kinectAtom, phaseAtom, setRecordAtom } from './atoms';
import { InSetProcess, InSetScene } from './ui-components/InSetScene';
import { PreSetProcess, PreSetScene } from './ui-components/PreSetScene';

export default function BodyTrackingNew() {
  // フェーズ
  const [, setPhase] = useAtom(phaseAtom);
  const scene = useRef<'PreSet' | 'InSet'>('PreSet');

  // RGB描画
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);

  // poseGrid
  const gridDivRef = useRef<HTMLDivElement | null>(null);
  const poseGrid = useRef<PoseGrid | null>(null);

  // Kinect
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // トレーニングデータ
  const [, setSetRecord] = useAtom(setRecordAtom);
  const setRef = useRef(resetSet());
  const repRef = useRef(resetRep(0));
  const repState = useRef(resetRepState());

  // リザルト画面のフォーム指導項目
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);

  // 目標レップ数
  const targetRepCount = 5;

  // 外れ値処理の設定
  // TODO: titration of outlier detection parameters
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 0.1, maxConsecutiveOutlierCount: 5 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlierRef = useRef(new FixOutlier(fixOutlierParams));
  const fixWorldOutlierRef = useRef(new FixOutlier(fixWorldOutlierPrams));

  // ガイド項目とチェックボックス
  const guideItemCommonDefault = { isCleared: false, isClearedInPreviousFrame: false, text: '' };
  const guideItems = useRef([
    { guide: standingPosition, name: 'standingPosition', ...guideItemCommonDefault },
    { guide: stanceWidth, name: 'stanceWidth', ...guideItemCommonDefault },
    // { guide: footAngle, name: 'footAngle', ...guideItemCommonDefault },
    { guide: shoulderPacking, name: 'shoulderPacking', ...guideItemCommonDefault },
  ]);
  const isAllGuideCleared = useRef(false);

  // タイマー
  const timerKey = useRef(0);

  // コンポーネントの再レンダリングを強制するためのstate
  const [, causeReRendering] = useState(0);

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
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (canvasImageData.current === null) {
        canvasRef.current.width = data.colorImageFrame.width / 2; // 撮影映像の中央部分だけを描画するため、canvasの横幅を半分にする
        canvasRef.current.height = data.colorImageFrame.height;
        canvasImageData.current = canvasCtx.createImageData(data.colorImageFrame.width, data.colorImageFrame.height);
      } else if (scene.current === 'PreSet') {
        renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);
      }

      if (data.bodyFrame.bodies.length > 0) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        const rawCurrentPose: Pose = convertKinectResultsToPose(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          data.bodyFrame.bodies[0].skeleton.joints,
          canvasRef.current,
          true,
          new Date().getTime(),
        );

        // 外れ値処理
        const currentPose: Pose = rawCurrentPose;
        if (prevPoseRef.current != null) {
          const fixedLandmarks = fixOutlierRef.current.fixOutlierOfLandmarkList(
            prevPoseRef.current.landmarks,
            rawCurrentPose.landmarks,
          );
          currentPose.landmarks = fixedLandmarks;
          const fixedWorldLandmarks = fixWorldOutlierRef.current.fixOutlierOfLandmarkList(
            prevPoseRef.current.worldLandmarks,
            rawCurrentPose.worldLandmarks,
          );
          currentPose.worldLandmarks = fixedWorldLandmarks;
        }
        prevPoseRef.current = currentPose;

        if (scene.current === 'PreSet') {
          PreSetProcess(canvasCtx, currentPose, guideItems, isAllGuideCleared, causeReRendering, timerKey);
        } else if (scene.current === 'InSet') {
          InSetProcess(
            poseGrid,
            currentPose,
            repState,
            setRef,
            repRef,
            formInstructionItems,
            setSetRecord,
            causeReRendering,
            setPhase,
            targetRepCount,
          );
        }
      } else if (poseGrid.current) {
        // 姿勢推定結果が空の場合、poseGridのマウス操作だけ更新する
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
    startKinect(kinect, onResults);
  }, [kinect, onResults]);

  return (
    <div>
      {scene.current === 'PreSet' ? (
        <PreSetScene
          canvasRef={canvasRef}
          guideItems={guideItems}
          timerKey={timerKey}
          isAllGuideCleared={isAllGuideCleared}
          scene={scene}
          causeReRendering={causeReRendering}
        />
      ) : (
        <InSetScene
          setRef={setRef}
          targetRepCount={targetRepCount}
          canvasRef={canvasRef}
          gridDivRef={gridDivRef}
          poseGrid={poseGrid}
        />
      )}
    </div>
  );
}
