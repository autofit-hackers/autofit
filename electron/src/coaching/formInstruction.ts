import { Rep } from '../training/rep';
import { FormInstructionItem } from './formInstructionItems';

export type FormInstructionSettings = {
  items: FormInstructionItem[];
};

// フォーム指導項目のリストの全要素に関して、判定関数を実行する
export const evaluateForm = (prevRep: Rep, settings: FormInstructionSettings): Rep => {
  const rep: Rep = prevRep;

  // settingsで指定した全ての指導項目に関してフォームを評価する
  settings.items.forEach((item) => {
    const evaluationScore = item.evaluate(prevRep);
    rep.formEvaluationScores = [...prevRep.formEvaluationScores, evaluationScore];
  });

  return rep;
};
