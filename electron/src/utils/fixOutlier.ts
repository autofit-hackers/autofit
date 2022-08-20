import zip from './zip';

// calculate exponential moving average (EMA)
function calcEMA(alpha: number, prev: number, curr: number) {
  return alpha * curr + (1 - alpha) * prev;
}

type FixOutlierOfValueReturn = {
  isOutlier: boolean;
  fixedValue: number;
};

type FixOutlierParams = {
  alpha: number;
  threshold: number;
};

function fixOutlierOfValue(prev: number, curr: number, fixOutlierParams: FixOutlierParams): FixOutlierOfValueReturn {
  const ema = calcEMA(fixOutlierParams.alpha, prev, curr);
  const diff = Math.abs(ema - curr);
  if (diff > fixOutlierParams.threshold) {
    return { isOutlier: true, fixedValue: ema };
  }

  return { isOutlier: false, fixedValue: ema };
}

type LandmarkIntersection = {
  x: number;
  y: number;
  z: number;
};

type LandmarkIntersectionList = LandmarkIntersection[];

type FixOutlierOfLandmarkReturn = {
  isOutlier: boolean;
  fixedLandmark: LandmarkIntersection;
};

function fixOutlierOfLandmark(
  prev: LandmarkIntersection,
  curr: LandmarkIntersection,
  fixOutlierParams: FixOutlierParams,
): FixOutlierOfLandmarkReturn {
  const x = fixOutlierOfValue(prev.x, curr.x, fixOutlierParams);
  const y = fixOutlierOfValue(prev.y, curr.y, fixOutlierParams);
  const z = fixOutlierOfValue(prev.z, curr.z, fixOutlierParams);
  const isOutlier = x.isOutlier || y.isOutlier || z.isOutlier;
  const fixedLandmark = { ...curr, x: x.fixedValue, y: y.fixedValue, z: z.fixedValue };

  return { isOutlier, fixedLandmark };
}

function fixOutlierOfLandmarkList(
  prev: LandmarkIntersectionList,
  curr: LandmarkIntersectionList,
  fixOutlierParams: FixOutlierParams,
): LandmarkIntersectionList {
  if (prev.length !== curr.length) {
    throw new Error('prev and curr must have the same length');
  }
  const fixedLandmarkList = zip(prev, curr).map(([prevLandmark, currLandmark]) => {
    const { fixedLandmark } = fixOutlierOfLandmark(prevLandmark, currLandmark, fixOutlierParams);

    return fixedLandmark;
  });

  return fixedLandmarkList;
}

export default fixOutlierOfLandmarkList;
