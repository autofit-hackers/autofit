import { Rep } from '../training_data/rep';
import { FormEvaluationResult, Set } from '../training_data/set';
import { FormInstructionItem } from './formInstructionItems';

// フォーム指導項目のリストの全要素に関して、１レップのフォームを評価する
export const calculateRepFormErrorScore = (prevRep: Rep, instructionItems: FormInstructionItem[]): Rep => {
  const rep: Rep = prevRep;

  instructionItems.forEach((instructionItem) => {
    rep.formErrorScores[instructionItem.id] = instructionItem.evaluateFrom(rep);
  });

  return rep;
};

// 各レップに対する表示テキストの決定
const decideDescriptionTexts = (eachRepErrors: number[], instructionItem: FormInstructionItem): string[] =>
  eachRepErrors.map((error) => {
    let errorDescriptions = '';
    if (error <= -1) {
      errorDescriptions = instructionItem.description.minus;
    } else if (error >= 1) {
      errorDescriptions = instructionItem.description.plus;
    } else {
      errorDescriptions = instructionItem.description.normal;
    }

    return errorDescriptions;
  });

// 各指導項目についてセットに対する総評の決定
const decideOverallTexts = (eachRepErrors: number[], instructionItem: FormInstructionItem): string => {
  // エラーの和を計算
  const errorSum = eachRepErrors.reduce((acc, err) => acc + err, 0);
  let summary = '';
  if (errorSum <= 0) {
    summary = instructionItem.summaryDescription.minus;
  } else {
    summary = instructionItem.summaryDescription.plus;
  }

  return summary;
};

// セット全体に対する指導項目スコアを100点満点で算出する
// TODO: Scoreの算出手法を再考する
const calculateScore = (eachRepErrorsAbs: number[]) => {
  const numberOfSuccessfulReps = eachRepErrorsAbs.filter((errorAbs) => errorAbs < 1).length;
  const numberOfTotalReps = eachRepErrorsAbs.length;
  const score = (numberOfSuccessfulReps / numberOfTotalReps) * 100;

  return score;
};

// 表示する総評テキストの選択
const selectDisplayedSummary = (set: Set) => {
  const scores = set.formEvaluationResults.map((result) => result.score);

  if (!Number.isNaN(scores[0])) {
    const minScore = scores.reduce((num1: number, num2: number) => Math.min(num1, num2), 1);

    // 最小値をとるインデックスを配列で取得し、コメントの配列を返す
    const indices = [];
    let idx = scores.indexOf(minScore);
    while (idx !== -1) {
      indices.push(idx);
      idx = scores.indexOf(minScore, idx + 1);
    }

    return indices.map((v) => set.formEvaluationResults[v].overallComment);
  }

  return [''];
};

// セット変数に各指導項目の評価結果を追加する
export const recordFormEvaluationResult = (prevSet: Set, instructionItems: FormInstructionItem[]): Set => {
  const set: Set = prevSet;

  instructionItems.forEach((instructionItem) => {
    const evaluationResult: FormEvaluationResult = {
      name: instructionItem.name,
      descriptionsForEachRep: [],
      overallComment: '',
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

    // セット全体に対する総評の決定
    evaluationResult.overallComment = decideOverallTexts(evaluationResult.eachRepErrors, instructionItem);

    set.formEvaluationResults[instructionItem.id] = evaluationResult;
  });

  // セットに対する総評の決定
  set.summary.description = selectDisplayedSummary(set);

  return set;
};
