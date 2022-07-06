import TrainingRep from "../../training/trainingRep";

class FormInstructionTemplate {
    readonly text: string;
    readonly judgeFunction: (trainingRep: TrainingRep) => number;
    readonly guidelineFunction: (trainingRep: TrainingRep) => void;
    readonly reason: string;
    readonly recommendMenu: string[];

    constructor(
        text: string,
        judgeFunction: (trainingRep: TrainingRep) => number,
        guidelineFunction: (trainingRep: TrainingRep) => void,
        reason: string,
        recommendMenu: string[],
    ) {
        this.text = text;
        this.judgeFunction = judgeFunction;
        this.guidelineFunction = guidelineFunction;
        this.reason = reason;
        this.recommendMenu = recommendMenu;
    }
}

export default FormInstructionTemplate;
