import Pose from "./pose";

export type RepState = {
    repCount: number;
    isLiftingUp: boolean;
    didTouchBottom: boolean;
    didTouchTop: boolean;
    initialBodyHeight: number;
    tmpBodyHeights: number[];
};

export const initRep = (repState: RepState, height: number) => {
    repState.initialBodyHeight = height;
    repState.tmpBodyHeights = new Array<number>(10);
    for (let i = 0; i < 10; i++) {
        repState.tmpBodyHeights[i] = repState.initialBodyHeight;
    }
};

export const updateRepCount = (
    repState: RepState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number,
) => {
    const height: number = pose.height();
    if (repState.tmpBodyHeights.length < 10) {
        initRep(repState, height);
    }
    const has_count_upped = checkIfRepFinished(repState, height, lowerThreshold, upperThreshold);
    updateLiftingState(repState, height);
    return has_count_upped;
};

export const checkIfRepFinished = (
    repState: RepState,
    height: number,
    lowerThreshold: number,
    upperThreshold: number,
): boolean => {
    if (!repState.didTouchBottom && height < repState.initialBodyHeight * lowerThreshold) {
        repState.didTouchBottom = true;
    } else if (repState.didTouchBottom && height > repState.initialBodyHeight * upperThreshold) {
        repState.repCount += 1;
        repState.didTouchBottom = false;
        return true;
    }
    return false;
};

export const updateLiftingState = (repState: RepState, height: number): void => {
    repState.tmpBodyHeights.shift();
    repState.tmpBodyHeights.push(height);
};

export const isKeyframe = (
    repState: RepState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number,
) => {
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
export const resetRep = (repState: RepState, pose: Pose): void => {
    repState.repCount = 0;
    repState.isLiftingUp = false;
    repState.didTouchBottom = false;
    repState.didTouchTop = true;
    repState.initialBodyHeight = pose.height();
    for (let i = 0; i < 10; i++) {
        repState.tmpBodyHeights[i] = repState.initialBodyHeight;
    }
};
