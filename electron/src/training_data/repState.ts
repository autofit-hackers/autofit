export type RepState = {
  isFirstFrameInRep: boolean;
  didTouchBottom: boolean;
  didTouchTop: boolean;
  isRepEnd: boolean;
  standingHeight: number | undefined;
};

export const resetRepState = (): RepState => ({
  isFirstFrameInRep: true,
  didTouchBottom: false,
  didTouchTop: true,
  isRepEnd: false,
  standingHeight: undefined,
});

export const setStandingHeight = (prevRepState: RepState, height: number): RepState => ({
  ...prevRepState,
  standingHeight: height,
});

export const checkIfRepFinish = (
  prevRepState: RepState,
  currentHeight: number,
  lowerThreshold: number,
  upperThreshold: number,
): RepState => {
  if (prevRepState.standingHeight === undefined) {
    throw Error('standingHeight is undefined');
  }

  const repState = prevRepState;
  // bottomに達してない場合（下がっている時）
  if (!prevRepState.didTouchBottom) {
    // 体長が十分に小さくなったら、didTouchBottomをtrueにする
    if (currentHeight < prevRepState.standingHeight * lowerThreshold) {
      repState.didTouchBottom = true;
    }
  }
  // bottomに達している場合（上がっている時）
  // 体長が十分に大きくなったら、1レップ完了
  else if (currentHeight > prevRepState.standingHeight * upperThreshold) {
    repState.didTouchBottom = false;
    repState.isRepEnd = true;

    return repState;
  }

  repState.isRepEnd = false;

  return repState;
};
