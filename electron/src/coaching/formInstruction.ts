import { Pose } from '../training_data/pose';
import { Rep } from '../training_data/rep';
import { Set } from '../training_data/set';
import type { CameraAngle, GuidelineSymbols } from '../utils/poseGrid';
import { FrameEvaluateParams } from './FormInstructionDebug';

type Description = { beforeNumber: string; afterNumber: string };

// TODO: クラスにしたほうが扱いやすいかも
export type FormInstructionItem = {
  readonly id: number;
  readonly name: string;
  readonly label: string;
  readonly image: string;
  readonly shortDescription: { negative: Description; normal: Description; positive: Description };
  readonly longDescription: { negative: string; positive: string };
  readonly fixedDescription: string;
  readonly voice: { negative: string; normal: string; positive: string };
  readonly reason?: string;
  readonly recommendMenu?: string[];
  readonly importance?: number;
  readonly poseGridCameraAngle: CameraAngle;
  // TODO: 以下２つはまとめてもいいかも
  readonly evaluateForm: (rep: Rep) => number;
  readonly calculateRealtimeValue: (evaluatedPose: Pose) => number;
  readonly calculateRealtimeThreshold: (criteriaPose: Pose) => { upper: number; middle: number; lower: number };
  readonly getGuidelineSymbols?: (rep: Rep, currentPose?: Pose) => GuidelineSymbols;
  readonly getCoordinateErrorFromIdeal: (rep: Rep) => number;
};

// TODO: けっこうごちゃごちゃしてきました。整理しましょう。
export type FormEvaluationResult = {
  name: string;
  descriptionsForEachRep: string[];
  isGood: boolean;
  shortSummary: string;
  longSummary: string;
  overallComment: string;
  eachRepErrorScores: number[];
  eachRepCoordinateErrors: number[];
  score: number;
  bestRepIndex: number;
  worstRepIndex: number;
  evaluatedValuesPerFrame: FrameEvaluateParams;
};

// フォーム指導項目のリストの全要素に関して、１レップのフォームを評価する
export const evaluateRepForm = (prevRep: Rep, instructionItems: FormInstructionItem[]): Rep => {
  const rep: Rep = prevRep;

  instructionItems.forEach((instructionItem) => {
    rep.formErrorScores[instructionItem.id] = instructionItem.evaluateForm(rep);
    rep.coordinateErrors[instructionItem.id] = instructionItem.getCoordinateErrorFromIdeal(rep);
    rep.guidelineSymbolsList[instructionItem.id] = instructionItem.getGuidelineSymbols
      ? instructionItem.getGuidelineSymbols(rep)
      : ({} as GuidelineSymbols);
  });

  return rep;
};

const judgeWhetherSetIsGoodForEachInstruction = (itemScore: number, threshold = 50): boolean => itemScore >= threshold;

const decideShortSummaryForEachInstruction = (
  isGood: boolean,
  worstRepErrorScore: number,
  worstRepCoordinateError: number,
  instructionItem: FormInstructionItem,
): string => {
  if (isGood) {
    return instructionItem.shortDescription.normal.beforeNumber + instructionItem.shortDescription.normal.afterNumber;
  }

  if (worstRepErrorScore < 0) {
    return (
      instructionItem.shortDescription.negative.beforeNumber +
      Math.abs(worstRepCoordinateError).toString() +
      instructionItem.shortDescription.negative.afterNumber
    );
  }

  return (
    instructionItem.shortDescription.positive.beforeNumber +
    worstRepCoordinateError.toString() +
    instructionItem.shortDescription.positive.afterNumber
  );
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
      isGood: true,
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

    // セット全体に対する指導項目スコアを算出する
    evaluationResult.score = calculateItemScore(eachRepErrorsAbs);

    // 各指導項目について、セット全体のgood/badを判定する
    evaluationResult.isGood = judgeWhetherSetIsGoodForEachInstruction(evaluationResult.score);

    // 各レップに対する表示テキストの決定
    evaluationResult.shortSummary = decideShortSummaryForEachInstruction(
      evaluationResult.isGood,
      evaluationResult.eachRepErrorScores[evaluationResult.worstRepIndex],
      evaluationResult.eachRepCoordinateErrors[evaluationResult.worstRepIndex],
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
