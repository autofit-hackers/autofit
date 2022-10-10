import * as Draw2D from '@mediapipe/drawing_utils';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'typeface-roboto';
import filledCheckbox from '../../resources/images/checkbox-filled.svg';
import emptyCheckbox from '../../resources/images/checkbox-unfilled.svg';
import {
  footAngle,
  shoulderPacking,
  stanceWidth,
  standingPosition,
} from '../coaching/squat-form-instructions/preSetGuide';
import { convertKinectResultsToPose, KINECT_POSE_CONNECTIONS, Pose } from '../training_data/pose';
import { renderBGRA32ColorFrame } from '../utils/drawCanvas';
import { FixOutlier, FixOutlierParams } from '../utils/fixOutlier';
import { startKinect } from '../utils/kinect';
import { kinectAtom, phaseAtom } from './atoms';
import './preset.css';
import CountdownCircles from './ui-components/CountdownCircles';

export default function PreSet() {
  // RGB描画
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasImageData = useRef<ImageData | null>(null);

  // フェーズ
  const [, setPhase] = useAtom(phaseAtom);

  // Kinect
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [kinect] = useAtom(kinectAtom);

  // 外れ値処理の設定
  // TODO: titration of outlier detection parameters
  const fixOutlierParams: FixOutlierParams = { alpha: 0.5, threshold: 0.1, maxConsecutiveOutlierCount: 5 };
  const fixWorldOutlierPrams: FixOutlierParams = { alpha: 0.5, threshold: 20, maxConsecutiveOutlierCount: 10 };
  const prevPoseRef = useRef<Pose | null>(null);
  const fixOutlierRef = useRef(new FixOutlier(fixOutlierParams));
  const fixWorldOutlierRef = useRef(new FixOutlier(fixWorldOutlierPrams));

  // ガイド項目とチェックボックス
  const guideItems = useRef([
    { guide: standingPosition, name: 'standingPosition', isCleared: false, isClearedInPreviousFrame: false, text: '' },
    { guide: stanceWidth, name: 'stanceWidth', isCleared: false, isClearedInPreviousFrame: false, text: '' },
    { guide: footAngle, name: 'footAngle', isCleared: false, isClearedInPreviousFrame: false, text: '' },
    { guide: shoulderPacking, name: 'shoulderPacking', isCleared: false, isClearedInPreviousFrame: false, text: '' },
  ]);
  const isAllGuideCleared = useRef(false);
  const checkBoxRefs = [
    useRef<HTMLImageElement>(null),
    useRef<HTMLImageElement>(null),
    useRef<HTMLImageElement>(null),
    useRef<HTMLImageElement>(null),
  ];

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
      } else {
        renderBGRA32ColorFrame(canvasCtx, canvasImageData.current, data.colorImageFrame);
      }

      if (data.bodyFrame.bodies.length > 0) {
        // Kinectの姿勢推定結果を自作のPose型に代入
        const rawCurrentPose: Pose = convertKinectResultsToPose(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          data.bodyFrame.bodies[0].skeleton.joints,
          canvasRef.current,
          true,
          0, // storeしない
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

        // pose estimationの結果を描画
        Draw2D.drawLandmarks(canvasCtx, currentPose.landmarks, {
          color: 'white',
          lineWidth: 4,
          radius: 8,
          fillColor: 'lightgreen',
        });
        Draw2D.drawConnectors(canvasCtx, currentPose.landmarks, KINECT_POSE_CONNECTIONS, {
          color: 'white',
          lineWidth: 4,
        });

        // ガイド項目のチェック
        for (let i = 0; i < guideItems.current.length; i += 1) {
          const { isCleared, guideText } = guideItems.current[i].guide.checkIfCleared(currentPose.worldLandmarks);
          guideItems.current[i].isClearedInPreviousFrame = guideItems.current[i].isCleared;
          guideItems.current[i].isCleared = isCleared;
          guideItems.current[i].text = guideText;
          const checkbox = checkBoxRefs[i].current;
          if (checkbox !== null) {
            checkbox.src = guideItems.current[i].isCleared ? filledCheckbox : emptyCheckbox;
          }
        }
      }

      // DISCUSS: いらないかも（repCount描画の名残り）
      canvasCtx.restore();

      // チェックボックス
      const isAllGuideClearedInPreviousFrame = isAllGuideCleared.current;
      isAllGuideCleared.current = guideItems.current.every((item) => item.isCleared === true);
      // 全ての項目にチェックが入ったらタイマースタートするために再レンダリング
      if (isAllGuideClearedInPreviousFrame === false && isAllGuideCleared.current === true) {
        causeReRendering((prev) => prev + 1);
        console.log('timer start');
      }
      // チェックが１つでも外れたらタイマーをリセット（再レンダリング）
      if (isAllGuideClearedInPreviousFrame === true && isAllGuideCleared.current === false) {
        causeReRendering((prev) => prev + 1);
        timerKey.current += 1;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Kinectの開始
  useEffect(() => {
    startKinect(kinect, onResults);
  }, [kinect, onResults]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="rgb-canvas"
        style={{ position: 'absolute', width: '40%', height: '70%', left: '5%', top: '15%' }}
      />
      <div style={{ position: 'absolute', width: '50%', left: '50%', top: '15%' }}>
        {checkBoxRefs.map((checkBoxRef, i) => (
          <div style={{}}>
            <p className="CheckBoxText">
              <img ref={checkBoxRef} src={emptyCheckbox} alt="Icon" className="inline" />
              {guideItems.current[i].guide.label}
            </p>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', width: '50%', height: '20%', left: '50%', top: '75%' }}>
        <CountdownCircles
          key={timerKey.current}
          isPlaying={isAllGuideCleared.current}
          duration={1}
          onComplete={() => {
            setPhase((prev) => prev + 1);
          }}
        />
      </div>
    </>
  );
}
