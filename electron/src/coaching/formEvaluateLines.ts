import { KJ } from '../utils/kinect_joints';
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
    drawBarsWithAcceptableError(
      ctx,
      (pose.landmarks[KJ.WRIST_LEFT].x + pose.landmarks[KJ.WRIST_RIGHT].x) / 2,
      (pose.landmarks[KJ.WRIST_LEFT].y + pose.landmarks[KJ.WRIST_RIGHT].y) / 2,
      pose.landmarks[KJ.KNEE_RIGHT].x,
      pose.landmarks[KJ.KNEE_RIGHT].y,
      canvasWidth,
      acceptableErr,
    );
  },
};

const squatDepth: FormEvaluationDrawer = {
  name: 'Squat Depth',
  showEvaluationLines: (ctx: CanvasRenderingContext2D, pose: Pose, canvasWidth: number, acceptableErr: number) => {
    drawBarsWithAcceptableError(
      ctx,
      pose.landmarks[KJ.KNEE_LEFT].x,
      pose.landmarks[KJ.KNEE_LEFT].y,
      pose.landmarks[KJ.KNEE_RIGHT].x,
      pose.landmarks[KJ.KNEE_RIGHT].y,
      canvasWidth,
      acceptableErr,
    );
  },
};

export const formInstructionItems: FormEvaluationDrawer[] = [barbellOnFootCenter, squatDepth];
