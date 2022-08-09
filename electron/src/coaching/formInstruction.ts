import { Rep } from '../training/rep';
import { FormEvaluationResult, Set } from '../training/set';
import { FormInstructionItem } from './formInstructionItems';

// フォーム指導項目のリストの全要素に関して、１レップのフォームを評価する
export const evaluateRepForm = (prevRep: Rep, instructionItems: FormInstructionItem[]): Rep => {
  const rep: Rep = prevRep;

  instructionItems.forEach((instructionItem) => {
    rep.formEvaluationErrors[instructionItem.id] = instructionItem.evaluate(rep);
  });

  return rep;
};

// セット変数に各指導項目の評価結果を追加する
export const recordFormEvaluationResult = (prevSet: Set, instructionItems: FormInstructionItem[]): Set => {
  const set: Set = prevSet;

  instructionItems.forEach((instructionItem) => {
    const evaluationResult: FormEvaluationResult = {
      name: instructionItem.name,
      text: '',
      eachRepErrors: [],
      score: 0,
      bestRepIndex: 0,
      worstRepIndex: 0,
    };

    // レップ変数に格納されている各指導項目のエラーを参照して、Resultオブジェクトに追加する
    set.reps.forEach((rep) => {
      evaluationResult.eachRepErrors[rep.index] = rep.formEvaluationErrors[instructionItem.id];
    });

    // エラーの絶対値が最大/最小となるレップのインデックスを記録する
    const eachRepErrorsAbs = evaluationResult.eachRepErrors.map((error) => Math.abs(error));
    evaluationResult.bestRepIndex = eachRepErrorsAbs.indexOf(Math.min(...eachRepErrorsAbs));
    evaluationResult.worstRepIndex = eachRepErrorsAbs.indexOf(Math.max(...eachRepErrorsAbs));

    // TODO: 各評価項目のエラーの正負を参照して適切にテキストを設定する
    // TODO: Scoreの計算

    set.formEvaluationResults[instructionItem.id] = evaluationResult;
  });

  return set;
};
