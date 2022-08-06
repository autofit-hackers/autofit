import { Rep } from '../training/rep';
import { Set } from '../training/set';
import { FormInstructionItem } from './formInstructionItems';

export type FormInstructionSettings = {
  items: FormInstructionItem[];
};

// フォーム指導項目のリストの全要素に関して、判定関数を実行する
export const evaluateRepForm = (prevRep: Rep, settings: FormInstructionSettings): Rep => {
  const rep: Rep = prevRep;

  // settingsで指定した全ての指導項目に関してフォームを評価する
  settings.items.forEach((instruction) => {
    const formError = instruction.evaluate(prevRep);
    rep.formErrors[`${instruction.text}`] = formError;
  });

  return rep;
};

// 各指導項目で表示すべきレップ番号を決定する
export const decideRepToBeShowed = (prevSet: Set, settings: FormInstructionSettings): Set => {
  const set: Set = prevSet;

  // settingsで指定した全ての指導項目に関してレップ番号を決定する
  settings.items.forEach((instruction) => {
    let FormHighestError = 0;
    set.reps.forEach((rep, repIndex) => {
      const absoluteFormScore = Math.abs(rep.formErrors[`${instruction.text}`]);
      if (absoluteFormScore > FormHighestError) {
        FormHighestError = absoluteFormScore;
        set.RepNumbersToBeShowed[`${instruction.text}`] = repIndex;
      }
    });
  });

  return set;
};
