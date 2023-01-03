import { DetectionResult } from '../ml-models/object-detection/detector';
import labels from '../ml-models/object-detection/labels.json';

export type RackState = {
  isExercising: boolean;
  estimatedTotalWeight: number;
  detectedPlates: string[];
};

export const resetRackState = (): RackState => ({
  isExercising: false,
  estimatedTotalWeight: 0,
  detectedPlates: [],
});

export const getDetectedEquipment = (result: DetectionResult, threshold: number) => {
  const { boxesData, scoresData, categoryData } = result;
  let weight = 0;
  const plates = [];
  let barbellCenterZ = 0;
  for (let i = 0; i < scoresData.length; i += 1) {
    if (scoresData[i] > threshold) {
      const category = labels[categoryData[i]];
      if (category === '20kg-bar') {
        weight += 20;
        plates.push('バーベル');
        barbellCenterZ = (boxesData[i * 4] + boxesData[i * 4 + 2]) / 2;
      } else if (category === '10kg-plate') {
        weight += 20;
        plates.push('10kg');
      } else if (category === '5kg-plate') {
        weight += 10;
        plates.push('5kg');
      } else if (category === '2.5kg-plate') {
        weight += 5;
        plates.push('2.5kg');
      } else {
        throw new Error(`Unknown category: ${category}`);
      }
    }
  }

  return { weight, plates, barbellCenterZ };
};

export const updateRackState = (prevState: RackState, result: DetectionResult, confidenceThre: number): RackState => {
  const { weight, plates, barbellCenterZ } = getDetectedEquipment(result, confidenceThre);
  if (barbellCenterZ !== 0 && !prevState.isExercising) {
    return {
      isExercising: true,
      estimatedTotalWeight: weight,
      detectedPlates: plates,
    };
  }

  return prevState;
};
