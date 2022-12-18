import { Exercise } from './Exercise';

export type RepState = {
  isFirstFrameInRep: boolean;
  didTouchBottom: boolean;
  didTouchTop: boolean;
  isRepEnd: boolean;
  interestJointsDistInFirstFrame: number | undefined; // スクワットは足首と肩の距離。ベンチプレスは肩と肩の距離。
};

export const resetRepState = (): RepState => ({
  isFirstFrameInRep: true,
  didTouchBottom: false,
  didTouchTop: true,
  isRepEnd: false,
  interestJointsDistInFirstFrame: undefined,
});

export const setInterestJointsDistance = (prevRepState: RepState, interestJointsDistance: number): RepState => ({
  ...prevRepState,
  interestJointsDistInFirstFrame: interestJointsDistance,
});

export const checkIfRepFinish = (
  prevRepState: RepState,
  interestJointLength: number,
  exercise: Exercise,
): RepState => {
  if (prevRepState.interestJointsDistInFirstFrame === undefined) {
    throw Error('standingHeight is undefined');
  }
  const { lower, upper } = exercise.repCountThresholds;

  const repState = prevRepState;
  // bottomに達してない場合（下がっている時）
  if (!prevRepState.didTouchBottom) {
    // 体長が十分に小さくなったら、didTouchBottomをtrueにする
    if (interestJointLength < prevRepState.interestJointsDistInFirstFrame * lower) {
      repState.didTouchBottom = true;
    }
  }
  // bottomに達している場合（上がっている時）
  // 体長が十分に大きくなったら、1レップ完了
  else if (interestJointLength > prevRepState.interestJointsDistInFirstFrame * upper) {
    repState.didTouchBottom = false;
    repState.isRepEnd = true;

    return repState;
  }

  repState.isRepEnd = false;

  return repState;
};
