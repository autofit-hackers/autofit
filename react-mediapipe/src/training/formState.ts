import Pose from './pose';

export type FormState = {
    isFirstFrameInRep: boolean;
    didTouchBottom: boolean;
    didTouchTop: boolean;
    isRepEnd: boolean;
    standingHeight: number;
};

const resetFormState = (formState: FormState, pose: Pose): void => {
    formState.isFirstFrameInRep = false;
    formState.didTouchBottom = false;
    formState.didTouchTop = true;
    formState.isRepEnd = false;
    formState.standingHeight = pose.height();
};

// PoseStreamで毎フレーム実行される
export const monitorForm = (
    formState: FormState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): FormState => {
    if (formState.isFirstFrameInRep) {
        resetFormState(formState, pose);
    }
    const currentHeight: number = pose.height();
    formState.isRepEnd = checkIfRepFinish(formState, currentHeight, lowerThreshold, upperThreshold);

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
        if (height < formState.standingHeight * lowerThreshold) {
            formState.didTouchBottom = true;
        }
    }
    // bottomに達している場合（上がっている時）
    else {
        // 体長が十分に大きくなったら、1レップ完了
        if (height > formState.standingHeight * upperThreshold) {
            formState.didTouchBottom = false;
            formState.isFirstFrameInRep = true;
            return true;
        }
    }
    return false;
};
