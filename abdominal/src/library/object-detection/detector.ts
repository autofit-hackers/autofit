import * as tf from '@tensorflow/tfjs';
import { Dispatch, SetStateAction } from 'react';

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
