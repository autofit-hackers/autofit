import labels from '../components/yolov5/utils/labels.json';

interface EstimateWeightProps {
  threshold: number;
  boxesData: Float32Array | Int32Array | Uint8Array;
  scoresData: Float32Array | Int32Array | Uint8Array;
  classesData: Float32Array | Int32Array | Uint8Array;
}

/**
 * Function to calculate weight from weight detection result
 * @param { threshold, boxesData, scoresData, classesData }: EstimateWeightProps
 * @returns none
 */
const estimateWeight = ({ threshold, boxesData, scoresData, classesData }: EstimateWeightProps) => {
  let weight = 0;
  const plates = [];
  let barbellCenterZ = 0;
  for (let i = 0; i < scoresData.length; i += 1) {
    if (scoresData[i] > threshold) {
      const klass = labels[classesData[i]];
      if (klass === '20kg-bar') {
        weight += 20;
        plates.push('バーベル');
        barbellCenterZ = (boxesData[i * 4] + boxesData[i * 4 + 2]) / 2;
      } else if (klass === '10kg-plate') {
        weight += 20;
        plates.push('10kg');
      } else if (klass === '5kg-plate') {
        weight += 10;
        plates.push('5kg');
      } else if (klass === '2.5kg-plate') {
        weight += 5;
        plates.push('2.5kg');
      } else {
        console.warn(`Unknown class: ${klass}`);
      }
    }
  }

  return { weight, plates, barbellCenterZ };
};

export default estimateWeight;
