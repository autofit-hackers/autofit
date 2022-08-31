import type { GuidelineSymbols } from '../utils/poseGrid';
import { heightInWorld, Pose } from './pose';
import type { FormInstructionItem } from '../coaching/formInstructionItems';

type KeyframesIndex = {
  top: number | undefined;
  bottom: number | undefined;
  ascendingMiddle: number | undefined;
  descendingMiddle: number | undefined;
};

export type Rep = {
  index: number;
  form: Pose[];
  keyframesIndex: KeyframesIndex;
  videoUrl: string;
  formErrorScores: number[];
  coordinateErrors: number[];
  guidelineSymbolsList: GuidelineSymbols[];
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
  videoUrl: '',
  coordinateErrors: [],
  formErrorScores: [],
  guidelineSymbolsList: [],
});

export const calculateKeyframes = (prevRep: Rep): Rep => {
  const bodyHeights = prevRep.form.map((pose) => heightInWorld(pose));

  // calculate top
  const topHeight = Math.max(...bodyHeights);
  const topIdx = bodyHeights.indexOf(topHeight);

  // calculate bottom
  const bottomHeight = Math.min(...bodyHeights);
  const bottomIdx = bodyHeights.indexOf(bottomHeight);

  let descendingMiddleIdx = topIdx;
  let ascendingMiddleIdx = bottomIdx;

  // top should be before bottom
  if (topIdx < bottomIdx) {
    const middleHeight = (topHeight + bottomHeight) / 2;

    // calculate descending_middle
    while (bodyHeights[descendingMiddleIdx] > middleHeight) {
      descendingMiddleIdx += 1;
    }

    // calculate ascending_middle
    while (bodyHeights[ascendingMiddleIdx] < middleHeight && ascendingMiddleIdx < bodyHeights.length - 1) {
      ascendingMiddleIdx += 1;
    }
  }

  return {
    ...prevRep,
    keyframesIndex: {
      top: topIdx,
      bottom: bottomIdx,
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

// フォーム指導項目のリストの全要素に関して、１レップのフォームを評価する
export const evaluateRepForm = (prevRep: Rep, instructionItems: FormInstructionItem[]): Rep => {
  const rep: Rep = prevRep;

  instructionItems.forEach((instructionItem) => {
    rep.formErrorScores[instructionItem.id] = instructionItem.evaluateFrom(rep);
    rep.coordinateErrors[instructionItem.id] = instructionItem.getCoordinateErrorFromIdeal
      ? instructionItem.getCoordinateErrorFromIdeal(rep)
      : 0;
    rep.guidelineSymbolsList[instructionItem.id] = instructionItem.getGuidelineSymbols
      ? instructionItem.getGuidelineSymbols(rep)
      : ({} as GuidelineSymbols);
  });

  return rep;
};
