import { getBottomPose, getTopPose, Rep } from '../training/rep';

export type FormInstructionItem = {
    readonly text: string;
    readonly evaluate: (rep: Rep) => boolean;
    readonly showGuideline?: (rep: Rep) => void;
    readonly reason?: string;
    readonly recommendMenu?: string[];
};

const squatDepth: FormInstructionItem = {
    text: 'Squat depth',
    evaluate: (rep: Rep) => {
        const topPoseKnee = getTopPose(rep)?.kneeCenter();
        const bottomPoseHip = getBottomPose(rep)?.hipCenter();

        // キーフレーム検出ができていなかった場合はクリアとする
        if (topPoseKnee === undefined || bottomPoseHip === undefined) {
            return true;
        }
        // TODO: improve algorithm
        // TODO: check if y is 0 at bottom of the frame
        const isCleared = bottomPoseHip.y <= topPoseKnee.y;
        return isCleared;
    }
};

const kneeOut: FormInstructionItem = {
    text: 'Knee out',
    evaluate: (rep: Rep) => {
        // undefinedの可能性があるためoptional chaining(?.)を使用
        const topPoseKneeDistance = getTopPose(rep)?.kneesDistance();
        const bottomPoseKneeDistance = getBottomPose(rep)?.kneesDistance();

        // キーフレーム検出ができていなかった場合はクリアとする
        if (topPoseKneeDistance === undefined || bottomPoseKneeDistance === undefined) {
            return true;
        }

        // TODO: improve algorithm
        const isCleared = bottomPoseKneeDistance <= topPoseKneeDistance;
        return isCleared;
    }
};

export const formInstructionItems: FormInstructionItem[] = [squatDepth, kneeOut];
