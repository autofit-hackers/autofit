import Pose from './pose';

export type FormState = {
    didTouchBottom: boolean;
    didTouchTop: boolean;
    isRepEnd: boolean;
    initialBodyHeight: number;
    tmpBodyHeights: number[];
};

export const initializeFormState = (formState: FormState, height: number): FormState => {
    formState.initialBodyHeight = height;
    formState.tmpBodyHeights = new Array<number>(10);
    for (let i = 0; i < 10; i++) {
        formState.tmpBodyHeights[i] = formState.initialBodyHeight;
    }

    return formState;
};

// PoseStreamで毎フレーム実行される
export const monitorForm = (
    formState: FormState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): FormState => {
    const height: number = pose.height();
    // HACK: 初期化している。ロジックがわかりにくい
    if (formState.tmpBodyHeights.length < 10) {
        formState = initializeFormState(formState, height);
    }

    formState.isRepEnd = checkIfRepFinish(formState, height, lowerThreshold, upperThreshold);
    formState.tmpBodyHeights = updateTmpBodyHeight(formState.tmpBodyHeights, height);

    return formState;
};

export const isKeyframeNow = (
    formState: FormState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): boolean => {
    const height: number = pose.height();
    if (formState.didTouchTop && height < formState.initialBodyHeight * lowerThreshold) {
        formState.didTouchTop = false;
        return true;
    } else if (!formState.didTouchTop && height > formState.initialBodyHeight * upperThreshold) {
        formState.didTouchTop = true;
        return false;
    } else {
        return false;
    }
};

// TODO: implement alternative of body_heights_df in training_set.py
export const resetRep = (formState: FormState, pose: Pose): FormState => {
    formState.didTouchBottom = false;
    formState.didTouchTop = true;
    formState.initialBodyHeight = pose.height();
    for (let i = 0; i < 10; i++) {
        formState.tmpBodyHeights[i] = formState.initialBodyHeight;
    }

    return formState;
};

const checkIfRepFinish = (
    formState: FormState,
    height: number,
    lowerThreshold: number,
    upperThreshold: number
): boolean => {
    // bottomに達してない場合（下がっている時）
    if (!formState.didTouchBottom) {
        // 体長が十分に小さくなったら、didTouchBottomをtrueにする
        if (height < formState.initialBodyHeight * lowerThreshold) {
            formState.didTouchBottom = true;
        }
        return false;
    }
    // bottomに達している場合（上がっている時）
    else {
        // 体長が十分に大きくなったら、1レップ完了
        if (height > formState.initialBodyHeight * upperThreshold) {
            formState.didTouchBottom = false;
            return true;
        } else {
            return false;
        }
    }
};

// WHY: tmpBodyHeightsをリストにする意味ある?
const updateTmpBodyHeight = (tmpBodyHeights: number[], height: number): number[] => {
    tmpBodyHeights.shift();
    tmpBodyHeights.push(height);

    return tmpBodyHeights;
};
