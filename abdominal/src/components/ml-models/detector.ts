import * as tf from '@tensorflow/tfjs';
import { Dispatch, SetStateAction } from 'react';
import labels from './labels.json';

export type DetectionResult = {
  boxesData: Float32Array | Int32Array | Uint8Array;
  scoresData: Float32Array | Int32Array | Uint8Array;
  categoryData: Float32Array | Int32Array | Uint8Array;
};

export type Detector = {
  model: tf.GraphModel<string | tf.io.IOHandler>;
  inputWidth: number;
  inputHeight: number;
};

export const loadDetectionModel = (
  modelName: string,
  setLoading: Dispatch<
    SetStateAction<{
      loading: boolean;
      progress: number;
    }>
  >,
): Detector | void => {
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
        model,
        inputWidth: model.inputs[0].shape[0],
        inputHeight: model.inputs[0].shape[3],
      };
    })
    .catch((err) => {
      throw err;
    });
};

export const detectOnFrame = async (
  detector: Detector | undefined,
  cameraCanvas: HTMLCanvasElement,
  onResults: (result: DetectionResult) => void,
) => {
  if (cameraCanvas === null) return;
  if (!detector) throw new Error('Model is null or undefined');

  tf.engine().startScope();
  const input = tf.tidy(() =>
    tf.image
      .resizeBilinear(tf.browser.fromPixels(cameraCanvas), [detector.inputWidth, detector.inputHeight])
      .div(255.0)
      .expandDims(0),
  );

  await detector.model.executeAsync(input).then((outputTensors) => {
    if (!Array.isArray(outputTensors)) throw new Error('Model output is not an array');
    const [boxes, scores, classes] = outputTensors.slice(0, 3);
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const categoryData = classes.dataSync();
    onResults({ boxesData, scoresData, categoryData });
    tf.dispose(outputTensors);
  });

  tf.engine().endScope();
};

export const drawBoundingBoxes = (canvas: HTMLCanvasElement | null, result: DetectionResult, threshold: number) => {
  const { boxesData, scoresData, categoryData } = result;
  if (canvas === null) return;
  const ctx = canvas.getContext('2d');
  if (ctx == null) throw new Error('Canvas context is null');

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // font configs
  const font = '20px sans-serif';
  ctx.font = font;
  ctx.textBaseline = 'top';

  for (let i = 0; i < scoresData.length; i += 1) {
    // filter based on class threshold
    if (scoresData[i] > threshold) {
      const label = labels[categoryData[i]];
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
