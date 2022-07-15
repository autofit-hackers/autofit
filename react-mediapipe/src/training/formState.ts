import Pose from './pose';

export type FormState = {
    isFirstFrameInRep: boolean;
    didTouchBottom: boolean;
    didTouchTop: boolean;
    isRepEnd: boolean;
    standingHeight: number;
};

const resetFormState = (pose: Pose): FormState => ({
    isFirstFrameInRep: false,
    didTouchBottom: false,
    didTouchTop: true,
    isRepEnd: false,
    standingHeight: pose.height()
});

const checkIfRepFinish = (
    prevFormState: FormState,
    height: number,
    lowerThreshold: number,
    upperThreshold: number
): FormState => {
    const formState = prevFormState;
    // bottomに達してない場合（下がっている時）
    if (!prevFormState.didTouchBottom) {
        // 体長が十分に小さくなったら、didTouchBottomをtrueにする
        if (height < prevFormState.standingHeight * lowerThreshold) {
            formState.didTouchBottom = true;
        }
    }
    // bottomに達している場合（上がっている時）
    // 体長が十分に大きくなったら、1レップ完了
    else if (height > prevFormState.standingHeight * upperThreshold) {
        formState.didTouchBottom = false;
        formState.isFirstFrameInRep = true;
        formState.isRepEnd = true;

        return formState;
    }

    formState.isRepEnd = false;

    return formState;
};

// PoseStreamで毎フレーム実行される
export const monitorForm = (
    prevFormState: FormState,
    pose: Pose,
    lowerThreshold: number,
    upperThreshold: number
): FormState => {
    let formState = prevFormState;
    if (prevFormState.isFirstFrameInRep) {
        formState = resetFormState(pose);
    }
    const currentHeight: number = pose.height();
    formState = checkIfRepFinish(prevFormState, currentHeight, lowerThreshold, upperThreshold);

    return formState;
};
