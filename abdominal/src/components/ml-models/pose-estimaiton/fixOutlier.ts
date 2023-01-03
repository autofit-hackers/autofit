import { NormalizedLandmark } from '@mediapipe/pose';

function zip<T, U>(a: T[], b: U[]): [T, U][] {
  return a.map((k, i) => [k, b[i]]);
}

// calculate exponential moving average (EMA)
// the bigger alpha is, the more dominant current value is
function calcEMA(alpha: number, prev: number, curr: number) {
  if (alpha <= 0 || alpha >= 1) {
    throw new Error('alpha must be between 0 and 1');
  }

  return alpha * curr + (1 - alpha) * prev;
}

type FixOutlierOfValueReturn = {
  isOutlier: boolean;
  fixedValue: number;
};

export type FixOutlierParams = {
  alpha: number;
  threshold: number;
  maxConsecutiveOutlierCount: number;
};

type FixOutlierOfLandmarkReturn = {
  isOutlier: boolean;
  fixedLandmark: NormalizedLandmark;
};

export class FixOutlier {
  readonly params: FixOutlierParams;
  consecutiveOutlierCount: number;

  constructor(params: FixOutlierParams) {
    this.params = params;
    this.consecutiveOutlierCount = 0;
  }

  reset() {
    this.consecutiveOutlierCount = 0;
  }

  // if an deviation of current value from exponential moving average (EMA) is larger than threshold, then return previous value
  // otherwise return current EMA
  fixOutlierOfValue(prev: number, curr: number): FixOutlierOfValueReturn {
    const ema = calcEMA(this.params.alpha, prev, curr);
    const diff = Math.abs(ema - curr);
    if (diff > this.params.threshold) {
      return { isOutlier: true, fixedValue: prev };
    }

    return { isOutlier: false, fixedValue: ema };
  }

  fixOutlierOfLandmark(prev: NormalizedLandmark, curr: NormalizedLandmark): FixOutlierOfLandmarkReturn {
    const x = this.fixOutlierOfValue(prev.x, curr.x);
    const y = this.fixOutlierOfValue(prev.y, curr.y);
    const z = this.fixOutlierOfValue(prev.z, curr.z);
    const isOutlier = x.isOutlier || y.isOutlier || z.isOutlier;
    const fixedLandmark = { ...curr, x: x.fixedValue, y: y.fixedValue, z: z.fixedValue };

    return { isOutlier, fixedLandmark };
  }

  fixOutlierOfLandmarkList(prev: NormalizedLandmark[], curr: NormalizedLandmark[]): NormalizedLandmark[] {
    if (prev.length !== curr.length) {
      throw new Error('prev and curr must have the same length');
    }

    const fixOutlierOfLandmarkReturns = zip(prev, curr).map(([prevLandmark, currLandmark]) =>
      this.fixOutlierOfLandmark(prevLandmark, currLandmark),
    );

    const isOutlier = fixOutlierOfLandmarkReturns.some(
      (fixOutlierOfLandmarkReturn) => fixOutlierOfLandmarkReturn.isOutlier,
    );
    this.consecutiveOutlierCount = isOutlier ? this.consecutiveOutlierCount + 1 : 0;
    // if current landmarks is judged as outliers maxConsecutiveOutlierCount times in a row,
    // then return current landmarks to avoid returning the same landmark value for a long time
    if (this.consecutiveOutlierCount >= this.params.maxConsecutiveOutlierCount) {
      this.reset();

      return curr;
    }

    return fixOutlierOfLandmarkReturns.map((fixOutlierOfLandmarkReturn) => fixOutlierOfLandmarkReturn.fixedLandmark);
  }
}
