import * as tf from '@tensorflow/tfjs';
import labels from './labels.json';

export const renderBoxes = (
  canvas: HTMLCanvasElement,
  classThreshold: number,
  boxesData: Float32Array | Int32Array | Uint8Array | undefined,
  scoresData: Float32Array | Int32Array | Uint8Array | undefined,
  classesData: Float32Array | Int32Array | Uint8Array | undefined,
) => {
  const ctx = canvas.getContext('2d');
  if (ctx == null) throw new Error('Canvas context is null');
  if (boxesData === undefined || scoresData === undefined || classesData === undefined) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // font configs
  const font = '20px sans-serif';
  ctx.font = font;
  ctx.textBaseline = 'top';

  for (let i = 0; i < scoresData.length; i += 1) {
    // filter based on class threshold
    if (scoresData[i] > classThreshold) {
      const label = labels[classesData[i]];
      const score = (scoresData[i] * 100).toFixed(1);

      let [x1, y1, x2, y2] = boxesData.slice(i * 4, (i + 1) * 4);
      x1 *= canvas.width;
      x2 *= canvas.width;
      y1 *= canvas.height;
      y2 *= canvas.height;
      const width = x2 - x1;
      const height = y2 - y1;

      // Draw the bounding box.
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x1, y1, width, height);

      // Draw the label background.
      ctx.fillStyle = '#00FF00';
      const textWidth = ctx.measureText(`${label} - ${score}%`).width;
      const textHeight = parseInt(font, 10); // base 10
      const yText = y1 - (textHeight + ctx.lineWidth);
      ctx.fillRect(
        x1 - 1,
        yText < 0 ? 0 : yText, // handle overflow label box
        textWidth + ctx.lineWidth,
        textHeight + ctx.lineWidth,
      );

      // Draw labels
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${label} - ${score}%`, x1 - 1, yText < 0 ? 0 : yText);
    }
  }
};

interface EstimateWeightProps {
  threshold: number;
  boxesData: Float32Array | Int32Array | Uint8Array;
  scoresData: Float32Array | Int32Array | Uint8Array;
  classesData: Float32Array | Int32Array | Uint8Array;
}

export type Model = {
  net: tf.GraphModel<string | tf.io.IOHandler>;
  inputShape: number[];
};

export type LoadingProps = { loading: boolean; progress: number };

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

export const modelLoader = (
  modelName: string,
  setLoading: (loadingProps: LoadingProps) => void,
  setModel: (model: Model) => void,
) => {
  tf.ready()
    .then(async () => {
      // load model
      const yolov5 = await tf.loadGraphModel(`${window.location.origin}/${modelName}_web_model/model.json`, {
        onProgress: (fractions) => {
          setLoading({ loading: true, progress: fractions }); // set loading fractions
        },
      });

      if (yolov5.inputs[0].shape == null) {
        throw new Error('Invalid model input shape');
      }
      // warming up model
      const dummyInput = tf.ones(yolov5.inputs[0].shape);
      const warmupResult = await yolov5.executeAsync(dummyInput);
      tf.dispose(warmupResult); // cleanup memory
      tf.dispose(dummyInput); // cleanup memory

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov5,
        inputShape: yolov5.inputs[0].shape,
      }); // set model & input shape
    })
    .catch((err) => {
      throw err;
    });
};

export const barbellDetector = (
  barbellVideo: HTMLVideoElement | null,
  barbellCanvas: HTMLCanvasElement | null,
  model: Model,
  modelWidth: number,
  modelHeight: number,
  threshold: number,
  currentWeight: number,
  setWeight: (weight: number) => void,
  setPlates: (plates: string[]) => void,
  setDoingExercise: (doingExercise: boolean) => void,
) => {
  /**
   * Function to detect every frame loaded from webcam in video tag.
   * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
   */
  const detectFrame = async () => {
    if (barbellVideo == null) return; // handle if source is null

    tf.engine().startScope();
    const input = tf.tidy(() =>
      tf.image.resizeBilinear(tf.browser.fromPixels(barbellVideo), [modelWidth, modelHeight]).div(255.0).expandDims(0),
    );

    await model.net.executeAsync(input).then((result) => {
      if (!Array.isArray(result)) throw new Error('Model output is not an array');
      if (barbellCanvas == null) throw new Error('Canvas is null or undefined');
      const [boxes, scores, classes] = result.slice(0, 3);
      const boxesData = boxes.dataSync();
      const scoresData = scores.dataSync();
      const classesData = classes.dataSync();
      const estimatedWeight = estimateWeight({ threshold, boxesData, scoresData, classesData });
      if (estimatedWeight.weight !== currentWeight || estimatedWeight.barbellCenterZ !== 0) {
        setWeight(estimatedWeight.weight);
        setPlates(estimatedWeight.plates);
        setDoingExercise(estimatedWeight.barbellCenterZ < 0.5);
      }
      renderBoxes(barbellCanvas, threshold, boxesData, scoresData, classesData);
      tf.dispose(result);
    });

    // WARN: how to handle this error?
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(detectFrame); // get another frame
    tf.engine().endScope();
  };

  void detectFrame();
};
