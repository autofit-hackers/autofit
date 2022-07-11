import { Rep } from '../training/rep';
import { FormInstructionItem } from './formInstructionItems';

export type FormInstructionSettings = {
    items: FormInstructionItem[];
};

export const evaluateForm = (rep: Rep, settings: FormInstructionSettings): Rep => {
    // settingsで指定された項目がなければスキップ
    if (settings.items.length === 0) {
        return rep;
    }

    // settingsで指定した全ての項目についてフォームを評価する
    for (const item of settings.items) {
        const isCleared = item.evaluate(rep);
        rep.formEvaluationScores = [...rep.formEvaluationScores, isCleared];
    }

    return rep;
};
