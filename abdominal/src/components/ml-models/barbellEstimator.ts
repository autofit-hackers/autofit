import * as tf from '@tensorflow/tfjs';
import { Dispatch, SetStateAction } from 'react';
import labels from './labels.json';

export type DetectionResults = {
  boxesData: Float32Array | Int32Array | Uint8Array;
  scoresData: Float32Array | Int32Array | Uint8Array;
  classesData: Float32Array | Int32Array | Uint8Array;
};

export type DetectionModel = {
  net: tf.GraphModel<string | tf.io.IOHandler>;
  inputWidth: number;
  inputHeight: number;
};

export type LoadingProps = { loading: boolean; progress: number };

export type BarbellDetector = {
  model: DetectionModel;
  threshold: number;
  setWeight: (weight: number) => void;
  setPlates: (plates: string[]) => void;
  setDoingExercise: (doingExercise: boolean) => void;
};

export const renderBoxes = (
  canvas: HTMLCanvasElement,
  ConfidenceThre: number,
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
    if (scoresData[i] > ConfidenceThre) {
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

export const getTotalWeight = ({ boxesData, scoresData, classesData }: DetectionResults, threshold: number) => {
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

export const loadDetectionModel = (
  modelName: string,
  setLoading: Dispatch<
    SetStateAction<{
      loading: boolean;
      progress: number;
    }>
  >,
): DetectionModel | void => {
  tf.ready()
    .then(async () => {
      // load model
      const model = await tf.loadGraphModel(`${window.location.origin}/${modelName}_web_model/model.json`, {
        onProgress: (fractions) => {
          setLoading({ loading: true, progress: fractions }); // set loading fractions
        },
      });

      if (model.inputs[0].shape == null) {
        throw new Error('Invalid model input shape');
      }
      // warming up model
      const dummyInput = tf.ones(model.inputs[0].shape);
      const warmupResult = await model.executeAsync(dummyInput);
      tf.dispose(warmupResult); // cleanup memory
      tf.dispose(dummyInput); // cleanup memory

      setLoading({ loading: false, progress: 1 });

      return {
        net: model,
        inputWidth: model.inputs[0].shape[0],
        inputHeight: model.inputs[0].shape[3],
      };
    })
    .catch((err) => {
      throw err;
    });
};

export const detectObjectsOnFrame = async (detector: BarbellDetector, cameraCanvas: HTMLCanvasElement) => {
  if (cameraCanvas === null) return;
  if (detector.model.net == null) throw new Error('Model is null or undefined');

  tf.engine().startScope();
  const input = tf.tidy(() =>
    tf.image
      .resizeBilinear(tf.browser.fromPixels(cameraCanvas), [detector.model.inputWidth, detector.model.inputHeight])
      .div(255.0)
      .expandDims(0),
  );

  const { threshold } = detector;
  await detector.model.net.executeAsync(input).then((result) => {
    if (!Array.isArray(result)) throw new Error('Model output is not an array');
    const [boxes, scores, classes] = result.slice(0, 3);
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();
    const { weight, plates, barbellCenterZ } = getTotalWeight(
      {
        boxesData,
        scoresData,
        classesData,
      },
      threshold,
    );
    if (barbellCenterZ !== 0) {
      detector.setWeight(weight);
      detector.setPlates(plates);
      detector.setDoingExercise(barbellCenterZ < 0.5);
    }
    tf.dispose(result);
  });

  tf.engine().endScope();
};
