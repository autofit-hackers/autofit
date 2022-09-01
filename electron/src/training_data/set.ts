import type { FormEvaluationResult, FormInstructionItem } from '../coaching/formInstructionItems';
import { FrameEvaluateParams } from '../coaching/FormInstructionDebug';
import { Rep } from './rep';

export type SetSummary = {
  weight?: number;
  description: string[];
  totalScore: number;
};

export type Set = { reps: Rep[]; formEvaluationResults: FormEvaluationResult[]; summary: SetSummary };

export const resetSet = (): Set => ({
  reps: [],
  formEvaluationResults: [],
  summary: { description: [''], totalScore: 0 },
});

export const appendRepToSet = (prevSet: Set, rep: Rep): Set => ({
  ...prevSet,
  reps: [...prevSet.reps, rep],
});

// 各レップに対する表示テキストの決定
const decideShortSummary = (eachRepErrors: number[], instructionItem: FormInstructionItem): string => {
  let shortSummary = '';
  // 平均errorの値でテキストを決定
  const error = eachRepErrors.reduce((num1: number, num2: number) => num1 + num2, 0) / eachRepErrors.length;
  if (error <= -1) {
    shortSummary = instructionItem.shortDescription.minus;
  } else if (error >= 1) {
    shortSummary = instructionItem.shortDescription.plus;
  } else {
    shortSummary = instructionItem.shortDescription.normal;
  }

  return shortSummary;
};

// 各指導項目についてセットに対する総評の決定
const decideLongSummary = (eachRepErrors: number[], instructionItem: FormInstructionItem): string => {
  // エラーの和を計算
  const errorSum = eachRepErrors.reduce((acc, err) => acc + err, 0);
  let summary = '';
  if (errorSum <= 0) {
    summary = instructionItem.longDescription.minus;
  } else {
    summary = instructionItem.longDescription.plus;
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

    return indices.map((v) => set.formEvaluationResults[v].longSummary);
  }

  return [''];
};

// セット変数に各指導項目の評価結果を追加する
// TODO: ここでevaluatedValuesPerFrameを追加することで白トビバグを解決しているが本当は好ましくない
export const recordFormEvaluationResult = (
  set: Set,
  instructionItems: FormInstructionItem[],
  evaluatedValuesPerFrame: FrameEvaluateParams[],
): Set => {
  const setCopy: Set = set;

  instructionItems.forEach((instructionItem, index) => {
    const evaluationResult: FormEvaluationResult = {
      name: instructionItem.name,
      shortSummary: '',
      longSummary: '',
      descriptionsForEachRep: [],
      overallComment: '',
      eachRepErrors: [],
      score: 0,
      bestRepIndex: 0,
      worstRepIndex: 0,
      evaluatedValuesPerFrame: evaluatedValuesPerFrame[index],
    };

    // レップ変数に格納されている各指導項目のエラースコアを参照して、Resultオブジェクトに追加する
    setCopy.reps.forEach((rep) => {
      evaluationResult.eachRepErrors[rep.index] = rep.formErrorScores[instructionItem.id];
    });

    // エラーの絶対値が最大/最小となるレップのインデックスを記録する
    const eachRepErrorsAbs = evaluationResult.eachRepErrors.map((error) => Math.abs(error));
    evaluationResult.bestRepIndex = eachRepErrorsAbs.indexOf(Math.min(...eachRepErrorsAbs));
    evaluationResult.worstRepIndex = eachRepErrorsAbs.indexOf(Math.max(...eachRepErrorsAbs));

    // セット全体に対する指導項目スコアを算出する
    evaluationResult.score = calculateScore(eachRepErrorsAbs);

    // 各レップに対する表示テキストの決定
    evaluationResult.shortSummary = decideShortSummary(evaluationResult.eachRepErrors, instructionItem);

    // セット全体に対する指導項目ごとの表示テキストを決定
    evaluationResult.shortSummary = decideShortSummary(eachRepErrorsAbs, instructionItem);

    // セット全体に対する総評の決定
    evaluationResult.longSummary = decideLongSummary(evaluationResult.eachRepErrors, instructionItem);

    setCopy.formEvaluationResults[instructionItem.id] = evaluationResult;
  });

  // セットに対する総評の決定
  setCopy.summary.description = selectDisplayedSummary(setCopy);

  // セットの合計得点を計算
  setCopy.summary.totalScore = Math.round(
    setCopy.formEvaluationResults
      .map((result) => result.score)
      .reduce((num1: number, num2: number) => num1 + num2, 0) / setCopy.formEvaluationResults.length,
  );

  return setCopy;
};
