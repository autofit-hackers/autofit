import { NormalizedLandmark, NormalizedLandmarkList } from '@mediapipe/pose';

import zip from './zip';

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

// if an deviation of current value from exponential moving average (EMA) is larger than threshold, then return previous value
// otherwise return current EMA
function fixOutlierOfValue(prev: number, curr: number, fixOutlierParams: FixOutlierParams): FixOutlierOfValueReturn {
  const ema = calcEMA(fixOutlierParams.alpha, prev, curr);
  const diff = Math.abs(ema - curr);
  if (diff > fixOutlierParams.threshold) {
    return { isOutlier: true, fixedValue: prev };
  }

  return { isOutlier: false, fixedValue: ema };
}

type FixOutlierOfLandmarkReturn = {
  isOutlier: boolean;
  fixedLandmark: NormalizedLandmark;
};

function fixOutlierOfLandmark(
  prev: NormalizedLandmark,
  curr: NormalizedLandmark,
  fixOutlierParams: FixOutlierParams,
): FixOutlierOfLandmarkReturn {
  const x = fixOutlierOfValue(prev.x, curr.x, fixOutlierParams);
  const y = fixOutlierOfValue(prev.y, curr.y, fixOutlierParams);
  const z = fixOutlierOfValue(prev.z, curr.z, fixOutlierParams);
  const isOutlier = x.isOutlier || y.isOutlier || z.isOutlier;
  const fixedLandmark = { ...curr, x: x.fixedValue, y: y.fixedValue, z: z.fixedValue };

  return { isOutlier, fixedLandmark };
}

export function fixOutlierOfLandmarkList(
  prev: NormalizedLandmarkList,
  curr: NormalizedLandmarkList,
  fixOutlierParams: FixOutlierParams,
): NormalizedLandmarkList {
  if (prev.length !== curr.length) {
    throw new Error('prev and curr must have the same length');
  }

  let consecutiveOutlierCount = 0;

  return zip(prev, curr).map(([prevLandmark, currLandmark]) => {
    const { isOutlier, fixedLandmark } = fixOutlierOfLandmark(prevLandmark, currLandmark, fixOutlierParams);
    // if currLandmark is classified as outlier maxConsecutiveOutlierCount times in a row,
    // then return currLandmark to avoid returning the same landmark value for a long time
    consecutiveOutlierCount = isOutlier ? consecutiveOutlierCount + 1 : 0;
    if (consecutiveOutlierCount > fixOutlierParams.maxConsecutiveOutlierCount) {
      return currLandmark;
    }

    return fixedLandmark;
  });
}
