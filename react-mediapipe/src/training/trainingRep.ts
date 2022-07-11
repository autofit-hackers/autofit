import Pose from './pose';

type KeyframesIdx = { top: number; bottom: number; ascendingMiddle: number; descendingMiddle: number };

export type TrainingRep = {
    repIdx: number;
    form: Pose[];
    keyframesIdx: KeyframesIdx;
};

export const recordPose = (trainingRep: TrainingRep, pose: Pose): TrainingRep => {
    trainingRep.form = [...trainingRep.form, pose];
    // WHY: unlock this? => this.body_heights.push(pose.get_2d_height());
    return trainingRep;
};

export const resetRep = (trainingRep: TrainingRep, repNumber: number): TrainingRep => {
    trainingRep.form = [];
    trainingRep.keyframesIdx = { top: -1, bottom: -1, ascendingMiddle: -1, descendingMiddle: -1 };
    trainingRep.repIdx = repNumber;

    return trainingRep;
};

export const recalculateKeyframes = (trainingRep: TrainingRep): TrainingRep => {
    const bodyHeights = trainingRep.form.map((pose) => pose.height());

    // calculate top
    const topHeight = Math.max(...bodyHeights);
    const topIdx = bodyHeights.indexOf(topHeight);
    trainingRep.keyframesIdx.top = topIdx;

    // calculate bottom
    const bottomHeight = Math.min(...bodyHeights);
    const bottomIdx = bodyHeights.indexOf(bottomHeight);
    trainingRep.keyframesIdx.bottom = bottomIdx;

    // top should be before bottom
    if (topIdx < bottomIdx) {
        const middleHeight = (topHeight + bottomHeight) / 2;

        // calculate descending_middle
        let descendingMiddleIdx = topIdx;
        while (bodyHeights[descendingMiddleIdx] > middleHeight) {
            descendingMiddleIdx += 1;
        }
        trainingRep.keyframesIdx.descendingMiddle = descendingMiddleIdx;

        // calculate ascending_middle
        let ascendingMiddleIdx = bottomIdx;
        while (bodyHeights[ascendingMiddleIdx] < middleHeight && ascendingMiddleIdx < bodyHeights.length - 1) {
            ascendingMiddleIdx += 1;
        }
        trainingRep.keyframesIdx.ascendingMiddle = ascendingMiddleIdx;
    }

    return trainingRep;
};

export const getTopPose = (trainingRep: TrainingRep): Pose => {
    return trainingRep.form[trainingRep.keyframesIdx.top];
};

export const getBottomPose = (trainingRep: TrainingRep): Pose => {
    return trainingRep.form[trainingRep.keyframesIdx.bottom];
};

export const getAscendingMiddlePose = (trainingRep: TrainingRep): Pose => {
    return trainingRep.form[trainingRep.keyframesIdx.ascendingMiddle];
};

export const getDescendingMiddlePose = (trainingRep: TrainingRep): Pose => {
    return trainingRep.form[trainingRep.keyframesIdx.descendingMiddle];
};
