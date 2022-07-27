import { drawBarsWithAcceptableError } from '../drawing_utils/thresholdBar';
import { Pose } from '../training/pose';

export type FormEvaluationDrawer = {
  readonly name: string;
  readonly showEvaluationLines: (
    ctx: CanvasRenderingContext2D,
    pose: Pose,
    canvasWidth: number,
    acceptableErr: number,
  ) => void;
};

const barbellOnFootCenter: FormEvaluationDrawer = {
  name: 'Barbel on foot center',
  showEvaluationLines: (ctx: CanvasRenderingContext2D, pose: Pose, canvasWidth: number, acceptableErr: number) => {
    const KNEE_LEFT = 19;
    const KNEE_RIGHT = 23;
    drawBarsWithAcceptableError(
      ctx,
      pose.landmarks[KNEE_LEFT].x,
      pose.landmarks[KNEE_LEFT].y,
      pose.landmarks[KNEE_RIGHT].x,
      pose.landmarks[KNEE_RIGHT].y,
      canvasWidth,
      acceptableErr,
    );
  },
};

const squatDepth: FormEvaluationDrawer = {
  name: 'Squat Depth',
  showEvaluationLines: (ctx: CanvasRenderingContext2D, pose: Pose, canvasWidth: number, acceptableErr: number) => {
    const KNEE_LEFT = 19;
    const KNEE_RIGHT = 23;
    drawBarsWithAcceptableError(
      ctx,
      pose.landmarks[KNEE_LEFT].x,
      pose.landmarks[KNEE_LEFT].y,
      pose.landmarks[KNEE_RIGHT].x,
      pose.landmarks[KNEE_RIGHT].y,
      canvasWidth,
      acceptableErr,
    );
  },
};

export const formInstructionItems: FormEvaluationDrawer[] = [barbellOnFootCenter, squatDepth];
