import { FormEvaluationResult, Set } from '../training/set';
import { Rep } from '../training/rep';
import { FormInstructionItem } from './formInstructionItems';

// フォーム指導項目のリストの全要素に関して、１レップのフォームを評価する
export const calculateRepFormErrorScore = (prevRep: Rep, instructionItems: FormInstructionItem[]): Rep => {
  const rep: Rep = prevRep;

  instructionItems.forEach((instructionItem) => {
    rep.formErrorScores[instructionItem.id] = instructionItem.evaluate(rep);
  });

  return rep;
};

// 各レップに対する表示テキストの決定
const decideDescriptionTexts = (eachRepErrors: number[], instructionItem: FormInstructionItem): string[] =>
  eachRepErrors.map((error) => {
    let errorDescriptions = '';
    if (error <= -1) {
      errorDescriptions = instructionItem.descriptionForNegativeError;
    } else if (error >= 1) {
      errorDescriptions = instructionItem.descriptionForPositiveError;
    } else {
      errorDescriptions = instructionItem.descriptionForNearlyZeroError;
    }

    return errorDescriptions;
  });

// セット全体に対する指導項目スコアを算出する
// TODO: Scoreの算出手法を再考する
const calculateScore = (eachRepErrorsAbs: number[]) => {
  const numberOfSuccessfulReps = eachRepErrorsAbs.filter((errorAbs) => errorAbs < 1).length;
  const numberOfTotalReps = eachRepErrorsAbs.length;
  const score = numberOfSuccessfulReps / numberOfTotalReps;

  return score;
};

// セット変数に各指導項目の評価結果を追加する
export const recordFormEvaluationResult = (prevSet: Set, instructionItems: FormInstructionItem[]): Set => {
  const set: Set = prevSet;

  instructionItems.forEach((instructionItem) => {
    const evaluationResult: FormEvaluationResult = {
      name: instructionItem.name,
      descriptionsForEachRep: [],
      eachRepErrors: [],
      score: 0,
      bestRepIndex: 0,
      worstRepIndex: 0,
    };

    // レップ変数に格納されている各指導項目のエラースコアを参照して、Resultオブジェクトに追加する
    set.reps.forEach((rep) => {
      evaluationResult.eachRepErrors[rep.index] = rep.formErrorScores[instructionItem.id];
    });

    // エラーの絶対値が最大/最小となるレップのインデックスを記録する
    const eachRepErrorsAbs = evaluationResult.eachRepErrors.map((error) => Math.abs(error));
    evaluationResult.bestRepIndex = eachRepErrorsAbs.indexOf(Math.min(...eachRepErrorsAbs));
    evaluationResult.worstRepIndex = eachRepErrorsAbs.indexOf(Math.max(...eachRepErrorsAbs));

    // セット全体に対する指導項目スコアを算出する
    evaluationResult.score = calculateScore(eachRepErrorsAbs);

    // 各レップに対する表示テキストの決定
    evaluationResult.descriptionsForEachRep = decideDescriptionTexts(evaluationResult.eachRepErrors, instructionItem);

    set.formEvaluationResults[instructionItem.id] = evaluationResult;
  });

  return set;
};
