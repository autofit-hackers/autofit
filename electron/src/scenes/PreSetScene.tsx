/* eslint-disable no-param-reassign */
import * as Draw2D from '@mediapipe/drawing_utils';
import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import { MutableRefObject, RefObject, SetStateAction } from 'react';
import { PreSetGuide } from '../coaching/squat-form-instructions/preSetGuide';
import { KINECT_POSE_CONNECTIONS, Pose } from '../training_data/pose';
import Checkbox from './ui-components/Checkbox';
import CountdownCircles from './ui-components/CountdownCircles';

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
      <canvas ref={canvasRef} className="rgb-canvas" style={{ position: 'absolute', height: '100vh' }} />
      <div
        style={{
          position: 'absolute',
          width: '44%',
          height: '10%',
          left: '53%',
          top: '15%',
          // backgroundColor: 'red',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{ p: 3, borderRadius: 10, justifyContent: 'center', alignItems: 'center', display: 'flex' }}
          style={{ fontWeight: 'bold', backgroundColor: '#ff9800', color: 'white' }}
        >
          チェック項目をクリアしてスタート！
        </Typography>
      </div>
      <div
        style={{
          position: 'absolute',
          width: '40%',
          height: '40%',
          left: '55%',
          top: '30%',
          backgroundColor: 'white',
        }}
      >
        <Box display="column" sx={{ justifyContent: 'space-between' }}>
          {guideItems.current.map((guideItem) => (
            <Checkbox isChecked={guideItem.isCleared} text={guideItem.guide.label} />
          ))}
        </Box>
      </div>
      <div
        style={{
          position: 'absolute',
          width: '18%',
          height: '30%',
          left: '82%',
          top: '70%',
          backgroundColor: 'white',
        }}
      >
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
