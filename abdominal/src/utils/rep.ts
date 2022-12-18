import { Exercise } from './exercise';
import { Pose } from './pose';

type KeyframesIndex = {
  top: number | undefined;
  bottom: number | undefined;
  ascendingMiddle: number | undefined;
  descendingMiddle: number | undefined;
};
type RealtimeMessage = { small: string; large: string };

export type Rep = {
  index: number;
  form: Pose[];
  keyframesIndex: KeyframesIndex;
  realtimeMessage: RealtimeMessage;
  videoUrl: string;
  errorScores: number[];
  coordinateErrors: number[];
};

export const appendPoseToForm = (prevRep: Rep, pose: Pose): Rep => ({
  ...prevRep,
  form: [...prevRep.form, pose],
});

export const resetRep = (repIndex: number): Rep => ({
  index: repIndex,
  form: [],
  keyframesIndex: {
    top: undefined,
    bottom: undefined,
    ascendingMiddle: undefined,
    descendingMiddle: undefined,
  },
  realtimeMessage: { small: '', large: '' },
  videoUrl: '',
  errorScores: [],
  coordinateErrors: [],
});

export const calculateKeyframes = (prevRep: Rep, exercise: Exercise): Rep => {
  const jointsDistances = prevRep.form.map((pose) => exercise.getInterestJointsDistance(pose));

  // calculate top
  const maxDistance = Math.max(...jointsDistances);
  const maxIdx = jointsDistances.indexOf(maxDistance);

  // calculate bottom
  const minDistances = Math.min(...jointsDistances);
  const minIdx = jointsDistances.indexOf(minDistances);

  let descendingMiddleIdx = maxIdx;
  let ascendingMiddleIdx = minIdx;

  // top should be before bottom
  if (maxIdx < minIdx) {
    const middleHeight = (maxDistance + minDistances) / 2;

    // calculate descending_middle
    while (jointsDistances[descendingMiddleIdx] > middleHeight) {
      descendingMiddleIdx += 1;
    }

    // calculate ascending_middle
    while (jointsDistances[ascendingMiddleIdx] < middleHeight && ascendingMiddleIdx < jointsDistances.length - 1) {
      ascendingMiddleIdx += 1;
    }
  }

  return {
    ...prevRep,
    keyframesIndex: {
      top: maxIdx,
      bottom: minIdx,
      ascendingMiddle: ascendingMiddleIdx,
      descendingMiddle: descendingMiddleIdx,
    },
  };
};

export const getTopPose = (rep: Rep): Pose | undefined => {
  if (rep.keyframesIndex.top !== undefined) {
    return rep.form[rep.keyframesIndex.top];
  }

  return undefined;
};

export const getBottomPose = (rep: Rep): Pose | undefined => {
  if (rep.keyframesIndex.bottom !== undefined) {
    return rep.form[rep.keyframesIndex.bottom];
  }

  return undefined;
};

export const getAscendingMiddlePose = (rep: Rep): Pose | undefined => {
  if (rep.keyframesIndex.ascendingMiddle !== undefined) {
    return rep.form[rep.keyframesIndex.ascendingMiddle];
  }

  return undefined;
};

export const getDescendingMiddlePose = (rep: Rep): Pose | undefined => {
  if (rep.keyframesIndex.descendingMiddle !== undefined) {
    return rep.form[rep.keyframesIndex.descendingMiddle];
  }

  return undefined;
};

export const getLastPose = (rep: Rep): Pose => rep.form[rep.form.length - 1];
