/* eslint-disable no-param-reassign */
import * as Draw2D from '@mediapipe/drawing_utils';
import { Box } from '@mui/system';
import { MutableRefObject, RefObject, SetStateAction } from 'react';
import { PreSetGuide } from '../../coaching/squat-form-instructions/preSetGuide';
import { KINECT_POSE_CONNECTIONS, Pose } from '../../training_data/pose';
import Checkbox from './Checkbox';
import CountdownCircles from './CountdownCircles';

export const PreSetProcess = (
  canvasCtx: CanvasRenderingContext2D,
  currentPose: Pose,
  guideItems: MutableRefObject<
    {
      guide: PreSetGuide;
      name: string;
      isCleared: boolean;
      text: string;
      frameCountAfterUnchecked: number;
    }[]
  >,
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
  // TODO: 姿勢推定できていない場合はチェックを外す
  for (let i = 0; i < guideItems.current.length; i += 1) {
    const { isCleared, guideText } = guideItems.current[i].guide.checkIfCleared(currentPose.worldLandmarks);
    if (!isCleared) {
      guideItems.current[i].frameCountAfterUnchecked += 1;
      // 10フレーム以上基準をクリアしていない場合、チェックを外す
      if (guideItems.current[i].frameCountAfterUnchecked >= 10) {
        guideItems.current[i].frameCountAfterUnchecked = 0;
        guideItems.current[i].isCleared = false;
        causeReRendering((prev) => prev + 1);
      }
    } else if (isCleared) {
      guideItems.current[i].frameCountAfterUnchecked = 0;
      guideItems.current[i].isCleared = true;
      causeReRendering((prev) => prev + 1);
    }
    guideItems.current[i].text = guideText;
  }

  const isAllGuideClearedInPreviousFrame = isAllGuideCleared.current;
  isAllGuideCleared.current = guideItems.current.every((item) => item.isCleared === true);
  // チェックが１つでも外れたらタイマーをリセット
  if (isAllGuideClearedInPreviousFrame === true && isAllGuideCleared.current === false) {
    timerKey.current += 1;
  }
};

export function PreSetScene(props: {
  canvasRef: RefObject<HTMLCanvasElement>;
  guideItems: MutableRefObject<
    {
      guide: PreSetGuide;
      name: string;
      isCleared: boolean;
      text: string;
      frameCountAfterUnchecked: number;
    }[]
  >;
  timerKey: MutableRefObject<number>;
  isAllGuideCleared: MutableRefObject<boolean>;
  scene: MutableRefObject<'PreSet' | 'InSet'>;
  causeReRendering: (value: SetStateAction<number>) => void;
}) {
  const { canvasRef, guideItems, timerKey, isAllGuideCleared, scene, causeReRendering } = props;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="rgb-canvas"
        style={{ position: 'absolute', width: '40%', height: '70%', left: '5%', top: '15%' }}
      />
      <div style={{ position: 'absolute', width: '55%', height: '60%', left: '55%', top: '25%' }}>
        <Box display="column" sx={{ justifyContent: 'space-between' }}>
          {guideItems.current.map((guideItem) => (
            <Checkbox isChecked={guideItem.isCleared} text={guideItem.guide.label} />
          ))}
        </Box>
      </div>
      <div style={{ position: 'absolute', width: '40%', height: '20%', left: '80%', top: '80%' }}>
        <CountdownCircles
          key={timerKey.current}
          isPlaying={isAllGuideCleared.current}
          duration={3}
          onComplete={() => {
            scene.current = 'InSet';
            causeReRendering((prev) => prev + 1);
          }}
        />
      </div>
    </>
  );
}
