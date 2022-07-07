import Pose from './pose';

export type RepState = {
    repCount: number;
    didTouchBottom: boolean;
    didTouchTop: boolean;
    isCountUppedNow: boolean;
    initialBodyHeight: number;
    tmpBodyHeights: number[];
};

const initRep = (repState: RepState, height: number): RepState => {
    repState.initialBodyHeight = height;
    repState.tmpBodyHeights = new Array<number>(10);
    for (let i = 0; i < 10; i++) {
        repState.tmpBodyHeights[i] = repState.initialBodyHeight;
    }

    return repState;
};

export const updateRepState = (
    repState: RepState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): RepState => {
    const height: number = pose.height();
    // HACK: 初期化している。ロジックがわかりにくい
    if (repState.tmpBodyHeights.length < 10) {
        repState = initRep(repState, height);
    }
    repState = updateRepCount(repState, height, lowerThreshold, upperThreshold);
    repState = updateTmpBodyHeight(repState, height);

    return repState;
};

const updateRepCount = (
    repState: RepState,
    height: number,
    lowerThreshold: number,
    upperThreshold: number
): RepState => {
    // bottomに達してない場合（下がっている時）
    if (!repState.didTouchBottom) {
        // 体長が十分に小さくなったら、didTouchBottomをtrueにする
        if (height < repState.initialBodyHeight * lowerThreshold) {
            repState.didTouchBottom = true;
        }
        repState.isCountUppedNow = false;
    }
    // bottomに達している場合（上がっている時）
    else {
        // 体長が十分に大きくなったら、1レップ完了
        if (height > repState.initialBodyHeight * upperThreshold) {
            repState.repCount += 1;
            repState.didTouchBottom = false;
            repState.isCountUppedNow = true;
        } else {
            repState.isCountUppedNow = false;
        }
    }
    return repState;
};

// HACK: tmpBodyHeightsをリストにする意味ある?
const updateTmpBodyHeight = (repState: RepState, height: number): RepState => {
    repState.tmpBodyHeights.shift();
    repState.tmpBodyHeights.push(height);

    return repState;
};

export const isKeyframeNow = (
    repState: RepState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): boolean => {
    const height: number = pose.height();
    if (repState.didTouchTop && height < repState.initialBodyHeight * lowerThreshold) {
        repState.didTouchTop = false;
        return true;
    } else if (!repState.didTouchTop && height > repState.initialBodyHeight * upperThreshold) {
        repState.didTouchTop = true;
        return false;
    } else {
        return false;
    }
};

// TODO: implement alternative of body_heights_df in training_set.py
export const resetRep = (repState: RepState, pose: Pose): RepState => {
    repState.repCount = 0;
    repState.didTouchBottom = false;
    repState.didTouchTop = true;
    repState.initialBodyHeight = pose.height();
    for (let i = 0; i < 10; i++) {
        repState.tmpBodyHeights[i] = repState.initialBodyHeight;
    }

    return repState;
};
