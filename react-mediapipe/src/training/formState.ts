import Pose from './pose';

export type FormState = {
    didTouchBottom: boolean;
    didTouchTop: boolean;
    isRepEnd: boolean;
    standingHeight: number;
};

export const resetFormState = (formState: FormState, pose: Pose): FormState => {
    formState.didTouchBottom = false;
    formState.didTouchTop = true;
    formState.standingHeight = pose.height();

    return formState;
};

// PoseStreamで毎フレーム実行される
export const monitorForm = (
    formState: FormState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): FormState => {
    const currentHeight: number = pose.height();
    formState.isRepEnd = checkIfRepFinish(formState, currentHeight, lowerThreshold, upperThreshold);

    return formState;
};

export const isKeyframeNow = (
    formState: FormState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): boolean => {
    const currentHeight: number = pose.height();
    if (formState.didTouchTop && currentHeight < formState.standingHeight * lowerThreshold) {
        formState.didTouchTop = false;
        return true;
    } else if (!formState.didTouchTop && currentHeight > formState.standingHeight * upperThreshold) {
        formState.didTouchTop = true;
        return false;
    } else {
        return false;
    }
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
        if (height < formState.standingHeight * lowerThreshold) {
            formState.didTouchBottom = true;
        }
        return false;
    }
    // bottomに達している場合（上がっている時）
    else {
        // 体長が十分に大きくなったら、1レップ完了
        if (height > formState.standingHeight * upperThreshold) {
            formState.didTouchBottom = false;
            return true;
        } else {
            return false;
        }
    }
};
