import Pose from './pose';

type KeyframesIndex = {
    top: number | undefined;
    bottom: number | undefined;
    ascendingMiddle: number | undefined;
    descendingMiddle: number | undefined;
};

export type Rep = {
    form: Pose[];
    keyframesIndex: KeyframesIndex;
    formEvaluationScores: number[];
};

export const appendPoseToForm = (rep: Rep, pose: Pose): Rep => {
    rep.form = [...rep.form, pose];
    // HELPME: unlock this? => this.body_heights.push(pose.get_2d_height());

    return rep;
};

export const resetRep = (rep: Rep): Rep => {
    rep.form = [];
    rep.keyframesIndex = {
        top: undefined,
        bottom: undefined,
        ascendingMiddle: undefined,
        descendingMiddle: undefined
    };

    return rep;
};

export const calculateKeyframes = (rep: Rep): Rep => {
    const bodyHeights = rep.form.map((pose) => pose.height());

    // calculate top
    const topHeight = Math.max(...bodyHeights);
    const topIdx = bodyHeights.indexOf(topHeight);
    rep.keyframesIndex.top = topIdx;

    // calculate bottom
    const bottomHeight = Math.min(...bodyHeights);
    const bottomIdx = bodyHeights.indexOf(bottomHeight);
    rep.keyframesIndex.bottom = bottomIdx;

    // top should be before bottom
    if (topIdx < bottomIdx) {
        const middleHeight = (topHeight + bottomHeight) / 2;

        // calculate descending_middle
        let descendingMiddleIdx = topIdx;
        while (bodyHeights[descendingMiddleIdx] > middleHeight) {
            descendingMiddleIdx += 1;
        }
        rep.keyframesIndex.descendingMiddle = descendingMiddleIdx;

        // calculate ascending_middle
        let ascendingMiddleIdx = bottomIdx;
        while (bodyHeights[ascendingMiddleIdx] < middleHeight && ascendingMiddleIdx < bodyHeights.length - 1) {
            ascendingMiddleIdx += 1;
        }
        rep.keyframesIndex.ascendingMiddle = ascendingMiddleIdx;
    }

    return rep;
};

export const getTopPose = (rep: Rep): Pose | undefined => {
    if (rep.keyframesIndex.top !== undefined) {
        return rep.form[rep.keyframesIndex.top];
    } else {
        return undefined;
    }
};

export const getBottomPose = (rep: Rep): Pose | undefined => {
    if (rep.keyframesIndex.bottom !== undefined) {
        return rep.form[rep.keyframesIndex.bottom];
    } else {
        return undefined;
    }
};

export const getAscendingMiddlePose = (rep: Rep): Pose | undefined => {
    if (rep.keyframesIndex.ascendingMiddle !== undefined) {
        return rep.form[rep.keyframesIndex.ascendingMiddle];
    } else {
        return undefined;
    }
};

export const getDescendingMiddlePose = (rep: Rep): Pose | undefined => {
    if (rep.keyframesIndex.descendingMiddle !== undefined) {
        return rep.form[rep.keyframesIndex.descendingMiddle];
    } else {
        return undefined;
    }
};

