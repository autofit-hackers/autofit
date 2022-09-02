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
// TODO: 役割が多すぎるので、複数の関数に分割する
const decideShortSummary = (
  itemScore: number,
  worstRepError: number,
  eachRepCoordinateErrors: number[],
  instructionItem: FormInstructionItem,
): string => {
  let shortSummary = '';

  // itemScoreが60点以下(bad表示)の場合は修正テキストを表示。ポジネガはもっともエラーが大きかったレップをもとに決定。
  if (itemScore <= 60 && worstRepError <= 0) {
    const negativeCoordinateErrorList = eachRepCoordinateErrors.filter((error) => error <= 1);
    const averageNegativeCoordinateError =
      negativeCoordinateErrorList.reduce((num1: number, num2: number) => num1 + num2, 0) /
      negativeCoordinateErrorList.length;
    shortSummary =
      instructionItem.shortDescription.negative.beforeNumber +
      Math.abs(Math.round(averageNegativeCoordinateError)).toString() +
      instructionItem.shortDescription.negative.afterNumber;
  } else if (itemScore <= 60 && worstRepError >= 0) {
    const positiveCoordinateErrorList = eachRepCoordinateErrors.filter((error) => error >= 1);
    const averagePositiveCoordinateError =
      positiveCoordinateErrorList.reduce((num1: number, num2: number) => num1 + num2, 0) /
      positiveCoordinateErrorList.length;
    shortSummary =
      instructionItem.shortDescription.positive.beforeNumber +
      Math.round(averagePositiveCoordinateError).toString() +
      instructionItem.shortDescription.positive.afterNumber;
  } else {
    shortSummary =
      instructionItem.shortDescription.normal.beforeNumber + instructionItem.shortDescription.normal.afterNumber;
  }

  return shortSummary;
};

// 各指導項目についてセットに対する総評の決定
const decideLongSummary = (eachRepErrors: number[], instructionItem: FormInstructionItem): string => {
  // エラーの和を計算
  const errorSum = eachRepErrors.reduce((acc, err) => acc + err, 0);
  let summary = '';
  if (errorSum <= 0) {
    summary = instructionItem.longDescription.negative;
  } else {
    summary = instructionItem.longDescription.positive;
  }

  return summary;
};

// セット全体に対する指導項目スコアを100点満点で算出する
// TODO: Scoreの算出手法を再考する
const calculateItemScore = (eachRepErrorsAbs: number[]) => {
  const numberOfSuccessfulReps = eachRepErrorsAbs.filter((errorAbs) => errorAbs < 1).length;
  const numberOfTotalReps = eachRepErrorsAbs.length;
  const itemScore = (numberOfSuccessfulReps / numberOfTotalReps) * 100;

  return itemScore;
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
    // TODO: set変数を生成した時点で指導項目の個数分の要素をもつ配列を格納しておく -> resetSet()
    const evaluationResult: FormEvaluationResult = {
      name: instructionItem.name,
      shortSummary: '',
      longSummary: '',
      descriptionsForEachRep: [],
      overallComment: '',
      eachRepErrorScores: [],
      eachRepCoordinateErrors: [],
      score: 0,
      bestRepIndex: 0,
      worstRepIndex: 0,
      evaluatedValuesPerFrame: evaluatedValuesPerFrame[index],
      bestRepError: 0,
      worstRepError: 0,
    };

    // レップ変数に格納されている各指導項目のエラースコアを参照して、Resultオブジェクトに追加する
    set.reps.forEach((rep) => {
      evaluationResult.eachRepErrorScores[rep.index] = rep.formErrorScores[instructionItem.id];
      evaluationResult.eachRepCoordinateErrors[rep.index] = rep.coordinateErrors[instructionItem.id];
    });

    // エラーの絶対値が最大/最小となるレップのインデックスを記録する
    const eachRepErrorsAbs = evaluationResult.eachRepErrorScores.map((error) => Math.abs(error));
    evaluationResult.bestRepIndex = eachRepErrorsAbs.indexOf(Math.min(...eachRepErrorsAbs));
    evaluationResult.worstRepIndex = eachRepErrorsAbs.indexOf(Math.max(...eachRepErrorsAbs));
    evaluationResult.bestRepError = evaluationResult.eachRepErrorScores[evaluationResult.bestRepIndex];
    evaluationResult.worstRepError = evaluationResult.eachRepErrorScores[evaluationResult.worstRepIndex];

    // セット全体に対する指導項目スコアを算出する
    evaluationResult.score = calculateItemScore(eachRepErrorsAbs);

    // 各レップに対する表示テキストの決定
    evaluationResult.shortSummary = decideShortSummary(
      evaluationResult.score,
      evaluationResult.worstRepError,
      evaluationResult.eachRepCoordinateErrors,
      instructionItem,
    );

    // 各指導項目に対するセット全体の評価分の決定
    evaluationResult.longSummary = decideLongSummary(evaluationResult.eachRepErrorScores, instructionItem);

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
