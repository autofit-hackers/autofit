/* eslint-disable no-param-reassign */
import * as Draw2D from '@mediapipe/drawing_utils';
import { Box } from '@mui/system';
import { useAtom } from 'jotai';
import { MutableRefObject, RefObject, SetStateAction } from 'react';
import { PreSetGuide } from '../../coaching/squat-form-instructions/preSetGuide';
import { KINECT_POSE_CONNECTIONS, Pose } from '../../training_data/pose';
import { phaseAtom } from '../atoms';
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
      isClearedInPreviousFrame: boolean;
      text: string;
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
  for (let i = 0; i < guideItems.current.length; i += 1) {
    const { isCleared, guideText } = guideItems.current[i].guide.checkIfCleared(currentPose.worldLandmarks);
    guideItems.current[i].isClearedInPreviousFrame = guideItems.current[i].isCleared;
    guideItems.current[i].isCleared = isCleared;
    guideItems.current[i].text = guideText;
  }

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
};

export function PreSetScene(props: {
  canvasRef: RefObject<HTMLCanvasElement>;
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
  causeReRendering: (value: SetStateAction<number>) => void;
}) {
  const { canvasRef, guideItems, timerKey, isAllGuideCleared, causeReRendering } = props;
  const [phase, setPhase] = useAtom(phaseAtom);

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
            setTimeout(() => setPhase(phase + 1), 1000);
            causeReRendering((prev) => prev + 1);
          }}
        />
      </div>
    </>
  );
}
