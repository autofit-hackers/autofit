import { Rep } from '../training_data/rep';
import { Set } from '../training_data/set';
import type { CameraAngle, GuidelineSymbols } from '../utils/poseGrid';

type EvaluationTextTemplate = { beforeNumber: string; afterNumber: string };
export type Thresholds = { upper: number; middle: number; lower: number };

export type Checkpoint = {
  readonly nameEN: string;
  readonly labelJP: string;
  readonly iconImageUrl: string;
  readonly lectureVideoUrl: string;
  readonly evaluationTextTemplate: {
    negative: EvaluationTextTemplate;
    normal: EvaluationTextTemplate;
    positive: EvaluationTextTemplate;
  };
  readonly voice: { negative: string; normal: string; positive: string };
  readonly poseGridCameraAngle: CameraAngle;
  readonly thresholds: Thresholds;
  readonly evaluateForm: (rep: Rep, thresholds: Thresholds) => number;
  readonly getGuidelineSymbols?: (rep: Rep, thresholds: Thresholds) => GuidelineSymbols;
  readonly getCoordinateErrorFromIdeal: (rep: Rep, thresholds: Thresholds) => number;
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

export type Errors = { errorScores: number; coordinateError: number };

export type CheckResult = {
  nameEN: string;
  isGood: boolean;
  description: string;
  scoreForSet: number;
  worstRepIndex: number;
  eachRepErrors: Errors[];
};

/**
 * [0, 1]のエラーから[0, 100]のスコアを計算する
 * |error| = 0、つまり完璧なときは100点
 * |error| = 1、つまりギリギリクリアのとき、20点となる
 * |error| > 1、つまりアウトのときは緩やかに減点し、errorが正常範囲の4倍で0点となる
 */
const calculateRepScore = (error: number): number => {
  const errorAbs = Math.abs(error);
  if (errorAbs <= 1) {
    return 100 - 20 * errorAbs;
  }

  return 10 - 5 * errorAbs;
};

const decideShortSummaryForEachCheckpoint = (
  isGood: boolean,
  worstRepErrorScore: number,
  worstRepCoordinateError: number,
  instructionItem: Checkpoint,
): string => {
  if (isGood) {
    return (
      instructionItem.evaluationTextTemplate.normal.beforeNumber +
      instructionItem.evaluationTextTemplate.normal.afterNumber
    );
  }

  if (worstRepErrorScore < 0) {
    return (
      instructionItem.evaluationTextTemplate.negative.beforeNumber +
      Math.abs(worstRepCoordinateError).toString() +
      instructionItem.evaluationTextTemplate.negative.afterNumber
    );
  }

  return (
    instructionItem.evaluationTextTemplate.positive.beforeNumber +
    worstRepCoordinateError.toString() +
    instructionItem.evaluationTextTemplate.positive.afterNumber
  );
};

/**
 * セット全体に対する指導項目スコアを100点満点で算出する
 */
const calculateScoreForEachInstruction = (repScores: number[]) =>
  repScores.reduce((acc, score) => acc + score, 0) / repScores.length;

// 表示する総評テキストの選択
const decideSummaryTextForSet = (set: Set) => {
  const scores = set.checkpointResults.map((result) => result.scoreForSet);

  if (!Number.isNaN(scores[0])) {
    const minScore = scores.reduce((num1: number, num2: number) => Math.min(num1, num2), 1);

    // 最小値をとるインデックスを配列で取得し、コメントの配列を返す
    const indices = [];
    let idx = scores.indexOf(minScore);
    while (idx !== -1) {
      indices.push(idx);
      idx = scores.indexOf(minScore, idx + 1);
    }

    return indices.map((v) => set.checkpointResults[v].description);
  }

  return [''];
};

// １レップのフォームを評価する
export const evaluateRep = (rep: Rep, checkpoints: Checkpoint[]): Rep => {
  const repCopy: Rep = rep;

  checkpoints.forEach((checkpoint, id) => {
    const { thresholds } = checkpoint;
    repCopy.checkpointErrors[id].errorScore = checkpoint.evaluateForm(repCopy, thresholds);
    repCopy.checkpointErrors[id].coordinateError = checkpoint.getCoordinateErrorFromIdeal(repCopy, thresholds);
    repCopy.guidelineSymbolsList[id] = checkpoint.getGuidelineSymbols
      ? checkpoint.getGuidelineSymbols(repCopy, thresholds)
      : ({} as GuidelineSymbols);
  });

  return repCopy;
};

// セット変数に各指導項目の評価結果を追加する
export const evaluateSet = (set: Set, checkpoints: Checkpoint[]): Set => {
  const setCopy: Set = set;

  // チェックポイントごとの評価
  checkpoints.forEach((checkpoint, id) => {
    const checkResult: CheckResult = {
      nameEN: checkpoint.nameEN,
      isGood: true,
      description: '',
      scoreForSet: 0,
      worstRepIndex: 0,
      eachRepErrors: [],
    };

    // レップ変数に格納されている各指導項目のエラースコアを参照して、Resultオブジェクトに追加する
    set.reps.forEach((rep, repId) => {
      checkResult.eachRepErrors[rep.index] = {
        errorScores: rep.checkpointErrors[repId].errorScore,
        coordinateError: rep.checkpointErrors[repId].coordinateError,
      };
    });

    // エラーの絶対値が最大となるレップのインデックスを記録する
    const eachRepErrorsAbs = checkResult.eachRepErrors.map((error) => Math.abs(error.errorScores));
    checkResult.worstRepIndex = eachRepErrorsAbs.indexOf(Math.max(...eachRepErrorsAbs));

    // セット全体に対する指導項目スコアを算出する
    checkResult.scoreForSet = calculateScoreForEachInstruction(
      checkResult.eachRepErrors.map((err) => calculateRepScore(err.errorScores)),
    );

    // 各指導項目について、セット全体のgood/badを判定する（50点以上でgood)
    checkResult.isGood = checkResult.scoreForSet >= 50;

    // 各チェックポイントモーダルでの表示文を決定する
    checkResult.description = decideShortSummaryForEachCheckpoint(
      checkResult.isGood,
      checkResult.eachRepErrors[checkResult.worstRepIndex].errorScores,
      checkResult.eachRepErrors[checkResult.worstRepIndex].coordinateError,
      checkpoint,
    );

    setCopy.checkpointResults[id] = checkResult;
  });

  // トレーニング時間（秒）の算出
  setCopy.resultSummary.timeToComplete = Math.round(
    (setCopy.reps.slice(-1)[0].form.slice(-1)[0].timestamp - setCopy.reps[0].form[0].timestamp) / 1000,
  );

  // 消費カロリーの産出
  // REF: https://www.supersports.com/ja-jp/xebio/media/hGg4AV6nfP2MZ3mfDMigRt
  // TODO: 詳細なカロリー計算
  setCopy.resultSummary.calorieConsumption = Math.round(
    (1.05 * 5.0 * 60 * setCopy.resultSummary.timeToComplete) / 3600,
  );

  // セットに対する総評の決定
  setCopy.resultSummary.description = decideSummaryTextForSet(setCopy);

  // セットの合計得点を計算
  setCopy.resultSummary.totalScore = Math.round(
    setCopy.checkpointResults
      .map((result) => result.scoreForSet)
      .reduce((num1: number, num2: number) => num1 + num2, 0) / setCopy.checkpointResults.length,
  );

  return setCopy;
};
