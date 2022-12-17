export type Exercise = 'squat' | 'bench_press' | 'dead_lift' | 'shoulder_press';
export type RepCountThresholds = { lower: number; upper: number };

export const getRepCountThresholds = (exercise: Exercise): RepCountThresholds => {
  switch (exercise) {
    case 'squat':
      return { lower: 0.8, upper: 0.95 };
    case 'bench_press':
      return { lower: 0.8, upper: 0.95 };
    case 'dead_lift':
      return { lower: 0.8, upper: 0.95 };
    case 'shoulder_press':
      return { lower: 0.8, upper: 0.95 };
    default:
      return { lower: 0, upper: 0 };
  }
};
