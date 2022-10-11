/* eslint-disable no-param-reassign */
import * as Draw2D from '@mediapipe/drawing_utils';
import { MutableRefObject, RefObject, SetStateAction } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import filledCheckbox from '../../../resources/images/checkbox-filled.svg';
import emptyCheckbox from '../../../resources/images/checkbox-unfilled.svg';
import { PreSetGuide } from '../../coaching/squat-form-instructions/preSetGuide';
import { KINECT_POSE_CONNECTIONS, Pose } from '../../training_data/pose';

export const PreSetProcess = (
  canvasCtx: CanvasRenderingContext2D,
  currentPose: Pose,
  guideItems: MutableRefObject<
    {
      guide: PreSetGuide;
      name: string;
      isCleared: boolean;
      isClearedInPreviousFrame: boolean;
      text: string;
    }[]
  >,
  checkBoxRefs: RefObject<HTMLImageElement>[],
  isAllGuideCleared: MutableRefObject<boolean>,
  causeReRendering: (value: SetStateAction<number>) => void,
  timerKey: MutableRefObject<number>,
) => {
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

  // チェックボックス
  const isAllGuideClearedInPreviousFrame = isAllGuideCleared.current;
  isAllGuideCleared.current = guideItems.current.every((item) => item.isCleared === true);
  // 全ての項目にチェックが入ったらタイマースタートするために再レンダリング
  if (isAllGuideClearedInPreviousFrame === false && isAllGuideCleared.current === true) {
    causeReRendering((prev) => prev + 1);
  }
  // チェックが１つでも外れたらタイマーをリセット（再レンダリング）
  if (isAllGuideClearedInPreviousFrame === true && isAllGuideCleared.current === false) {
    causeReRendering((prev) => prev + 1);
    timerKey.current += 1;
  }
};

export function PreSetScene(props: {
  canvasRef: RefObject<HTMLCanvasElement>;
  checkBoxRefs: RefObject<HTMLImageElement>[];
  guideItems: MutableRefObject<
    {
      guide: PreSetGuide;
      name: string;
      isCleared: boolean;
      isClearedInPreviousFrame: boolean;
      text: string;
    }[]
  >;
  timerKey: MutableRefObject<number>;
  isAllGuideCleared: MutableRefObject<boolean>;
  scene: MutableRefObject<'PreSet' | 'InSet'>;
  causeReRendering: (value: SetStateAction<number>) => void;
}) {
  const { canvasRef, checkBoxRefs, guideItems, timerKey, isAllGuideCleared, scene, causeReRendering } = props;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="rgb-canvas"
        style={{ position: 'absolute', width: '789px', height: '836.49px', left: '149px', top: '122px' }}
      />
      <div style={{ position: 'absolute', top: '72px', left: '1069px' }}>
        {checkBoxRefs.map((checkBoxRef, i) => (
          <div style={{}}>
            <img ref={checkBoxRef} src={emptyCheckbox} alt="Icon" />
            <p>{guideItems.current[i].guide.label}</p>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', width: '179.48px', height: '174px', left: '1643px', top: '826px' }}>
        <CountdownCircleTimer
          key={timerKey.current}
          isPlaying={isAllGuideCleared.current}
          duration={3}
          colors={['#004777', '#F7B801', '#A30000']}
          colorsTime={[3, 2, 1]}
          onComplete={() => {
            scene.current = 'InSet';
            causeReRendering((prev) => prev + 1);
          }}
        >
          {({ remainingTime }) => remainingTime}
        </CountdownCircleTimer>
      </div>
    </>
  );
}
