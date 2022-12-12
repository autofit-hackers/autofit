import * as tf from '@tensorflow/tfjs';
import renderBoxes from './renderBox';

export type Model = {
  net: tf.GraphModel<string | tf.io.IOHandler>;
  inputShape: number[];
};

/**
 * Function to detect video from every source.
 */
const detect = (
  vidSource: HTMLVideoElement | null,
  model: Model,
  classThreshold: number,
  canvasRef: HTMLCanvasElement | null,
) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

  /**
   * Function to detect every frame from video
   */
  const detectFrame = async () => {
    if (vidSource == null || canvasRef == null) return; // handle if source is null

    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) return; // handle if source is closed

    tf.engine().startScope(); // start scoping tf engine
    const input = tf.tidy(() =>
      tf.image
        .resizeBilinear(tf.browser.fromPixels(vidSource), [modelWidth, modelHeight]) // resize frame
        .div(255.0) // normalize
        .expandDims(0),
    );

    await model.net.executeAsync(input).then((res) => {
      if (!Array.isArray(res)) throw new Error('Model output is not an array');
      const [boxes, scores, classes] = res.slice(0, 3);
      const boxesData = boxes.dataSync();
      const scoresData = scores.dataSync();
      const classesData = classes.dataSync();
      renderBoxes(canvasRef, classThreshold, boxesData, scoresData, classesData); // render boxes
      tf.dispose(res); // clear memory
    });

    requestAnimationFrame(detectFrame); // get another frame
    tf.engine().endScope(); // end of scoping
  };

  void detectFrame(); // initialize to detect every frame
};

export default detect;
