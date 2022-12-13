export type RepState = {
  isFirstFrameInRep: boolean;
  didTouchBottom: boolean;
  didTouchTop: boolean;
  isRepEnd: boolean;
  interestJointsDistanceInFirstFrame: number | undefined; // スクワットは膝と肩の距離。ベンチプレスは肩と肩の距離。
};

export const resetRepState = (): RepState => ({
  isFirstFrameInRep: true,
  didTouchBottom: false,
  didTouchTop: true,
  isRepEnd: false,
  interestJointsDistanceInFirstFrame: undefined,
});

export const setInterestJointsDistance = (prevRepState: RepState, height: number): RepState => ({
  ...prevRepState,
  interestJointsDistanceInFirstFrame: height,
});

export const checkIfRepFinish = (
  prevRepState: RepState,
  interestJointLength: number,
  lowerThreshold: number,
  upperThreshold: number,
): RepState => {
  if (prevRepState.interestJointsDistanceInFirstFrame === undefined) {
    throw Error('standingHeight is undefined');
  }

  const repState = prevRepState;
  // bottomに達してない場合（下がっている時）
  if (!prevRepState.didTouchBottom) {
    // 体長が十分に小さくなったら、didTouchBottomをtrueにする
    if (interestJointLength < prevRepState.interestJointsDistanceInFirstFrame * lowerThreshold) {
      repState.didTouchBottom = true;
    }
  }
  // bottomに達している場合（上がっている時）
  // 体長が十分に大きくなったら、1レップ完了
  else if (interestJointLength > prevRepState.interestJointsDistanceInFirstFrame * upperThreshold) {
    repState.didTouchBottom = false;
    repState.isRepEnd = true;

    return repState;
  }

  repState.isRepEnd = false;

  return repState;
};
