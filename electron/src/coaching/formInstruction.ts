import { Pose } from '../training_data/pose';
import { Rep } from '../training_data/rep';
import { Set } from '../training_data/set';
import type { CameraAngle, GuidelineSymbols } from '../utils/poseGrid';
import { FrameEvaluateParams } from './FormInstructionDebug';

type Description = { beforeNumber: string; afterNumber: string };
export type Thresholds = { upper: number; middle: number; lower: number };
export type ResultDescription = { short: string; long: string; fixed: string };
export type Errors = { error: number; score: number; coordinateError: number };

// TODO: プロパティの整理
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
  readonly thresholds: Thresholds;
  readonly evaluateForm: (rep: Rep, thresholds: Thresholds) => number;
  readonly calculateRealtimeValue: (evaluatedPose: Pose) => number;
  readonly calculateRealtimeThreshold: (criteriaPose: Pose) => Thresholds;
  readonly getGuidelineSymbols?: (rep: Rep, thresholds: Thresholds) => GuidelineSymbols;
  readonly getCoordinateErrorFromIdeal: (rep: Rep, thresholds: Thresholds) => number;
};

// TODO: プロパティの整理
export type SetEvaluationResult = {
  name: string;
  isGood: boolean;
  description: ResultDescription;
  totalScore: number;
  bestRepIndex: number;
  worstRepIndex: number;
  eachRepErrors: Errors[];
  evaluatedValuesPerFrame: FrameEvaluateParams; // TODO: レップ中に計算しているが後処理で算出する方が適切
};

export const calculateError = (
  thresholds: { upper: number; middle: number; lower: number },
  value: number,
): number => {
  if (value < thresholds.middle) {
    return (value - thresholds.middle) / (thresholds.middle - thresholds.lower);
  }

  return (value - thresholds.middle) / (thresholds.upper - thresholds.middle);
};

// フォーム指導項目のリストの全要素に関して、１レップのフォームを評価する
export const evaluateRepForm = (prevRep: Rep, instructionItems: FormInstructionItem[]): Rep => {
  const rep: Rep = prevRep;

  instructionItems.forEach((instructionItem) => {
    const { thresholds } = instructionItem;
    rep.formErrorScores[instructionItem.id] = instructionItem.evaluateForm(rep, thresholds);
    rep.coordinateErrors[instructionItem.id] = instructionItem.getCoordinateErrorFromIdeal(rep, thresholds);
    rep.guidelineSymbolsList[instructionItem.id] = instructionItem.getGuidelineSymbols
      ? instructionItem.getGuidelineSymbols(rep, thresholds)
      : ({} as GuidelineSymbols);
  });

  return rep;
};

/**
 * [0, 1]のエラーから[0, 100]のスコアを計算する
 * |error| = 0、つまり完璧なときは100点
 * |error| = 1、つまりギリギリクリアのとき、20点となる
 * |error| > 1、つまりアウトのときは緩やかに減点し、errorが正常範囲の4倍で0点となる
 */
const calculateScoreFromError = (error: number): number => {
  const errorAbs = Math.abs(error);
  if (errorAbs <= 1) {
    return 100 - 20 * errorAbs;
  }

  return 10 - 5 * errorAbs;
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
const decideLongSummary = (eachRepErrors: Errors[], instructionItem: FormInstructionItem): string => {
  // エラーの和を計算
  const errorSum = eachRepErrors.reduce((acc, err) => acc + err.error, 0);
  let summary = '';
  if (errorSum <= 0) {
    summary = instructionItem.longDescription.negative;
  } else {
    summary = instructionItem.longDescription.positive;
  }

  return summary;
};

/**
 * セット全体に対する指導項目スコアを100点満点で算出する
 */
const calculateScoreForEachInstruction = (repScores: number[]) =>
  repScores.reduce((acc, score) => acc + score, 0) / repScores.length;

// 表示する総評テキストの選択
const selectDisplayedSummary = (set: Set) => {
  const scores = set.formEvaluationResults.map((result) => result.totalScore);

  if (!Number.isNaN(scores[0])) {
    const minScore = scores.reduce((num1: number, num2: number) => Math.min(num1, num2), 1);

    // 最小値をとるインデックスを配列で取得し、コメントの配列を返す
    const indices = [];
    let idx = scores.indexOf(minScore);
    while (idx !== -1) {
      indices.push(idx);
      idx = scores.indexOf(minScore, idx + 1);
    }

    return indices.map((v) => set.formEvaluationResults[v].description.long);
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
    const evaluationResult: SetEvaluationResult = {
      name: instructionItem.name,
      isGood: true,
      description: {
        short: '',
        long: '',
        fixed: '',
      },
      totalScore: 0,
      bestRepIndex: 0,
      worstRepIndex: 0,
      evaluatedValuesPerFrame: evaluatedValuesPerFrame[index],
      eachRepErrors: [],
    };

    // レップ変数に格納されている各指導項目のエラースコアを参照して、Resultオブジェクトに追加する
    set.reps.forEach((rep) => {
      evaluationResult.eachRepErrors[rep.index] = {
        score: calculateScoreFromError(rep.formErrorScores[instructionItem.id]), // TODO
        error: rep.formErrorScores[instructionItem.id],
        coordinateError: rep.coordinateErrors[instructionItem.id],
      };
    });

    // エラーの絶対値が最大/最小となるレップのインデックスを記録する
    const eachRepErrorsAbs = evaluationResult.eachRepErrors.map((error) => Math.abs(error.error));
    evaluationResult.bestRepIndex = eachRepErrorsAbs.indexOf(Math.min(...eachRepErrorsAbs));
    evaluationResult.worstRepIndex = eachRepErrorsAbs.indexOf(Math.max(...eachRepErrorsAbs));

    // セット全体に対する指導項目スコアを算出する
    evaluationResult.totalScore = calculateScoreForEachInstruction(
      evaluationResult.eachRepErrors.map((err) => err.score),
    );

    // 各指導項目について、セット全体のgood/badを判定する
    evaluationResult.isGood = judgeWhetherSetIsGoodForEachInstruction(evaluationResult.totalScore);

    // 各レップに対する表示テキストの決定
    evaluationResult.description.short = decideShortSummaryForEachInstruction(
      evaluationResult.isGood,
      evaluationResult.eachRepErrors[evaluationResult.worstRepIndex].error,
      evaluationResult.eachRepErrors[evaluationResult.worstRepIndex].coordinateError,
      instructionItem,
    );

    // 各指導項目に対するセット全体の評価分の決定
    evaluationResult.description.long = decideLongSummary(evaluationResult.eachRepErrors, instructionItem);

    setCopy.formEvaluationResults[instructionItem.id] = evaluationResult;
  });

  // セットに対する総評の決定
  setCopy.summary.description = selectDisplayedSummary(setCopy);

  // セットの合計得点を計算
  setCopy.summary.totalScore = Math.round(
    setCopy.formEvaluationResults
      .map((result) => result.totalScore)
      .reduce((num1: number, num2: number) => num1 + num2, 0) / setCopy.formEvaluationResults.length,
  );

  return setCopy;
};
