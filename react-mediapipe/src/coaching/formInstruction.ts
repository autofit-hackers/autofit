import { Rep } from '../training/rep';
import { FormInstructionItem } from './formInstructionItems';

export type FormInstructionSettings = {
  items: FormInstructionItem[];
};

export const evaluateForm = (prevRep: Rep, settings: FormInstructionSettings): Rep => {
  const rep: Rep = prevRep;

  // settingsで指定した全ての指導項目に関してフォームを評価する
  settings.items.forEach((item) => {
    const isCleared = item.evaluate(prevRep);
    rep.formEvaluationScores = [...prevRep.formEvaluationScores, isCleared];
  });

  return rep;
};
