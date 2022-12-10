import * as tf from '@tensorflow/tfjs';
import { renderBoxes } from './renderBox';

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
 * @param {Number} classThreshold class threshold
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
const detect = (vidSource, model: tf.GraphModel, classThreshold, canvasRef) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3) as number; // get model width and height

  /**
   * Function to detect every frame from video
   */
  const detectFrame = async () => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) return; // handle if source is closed

    tf.engine().startScope(); // start scoping tf engine
    const input = tf.tidy(() =>
      tf.image
        .resizeBilinear(tf.browser.fromPixels(vidSource), [modelWidth, modelHeight]) // resize frame
        .div(255.0) // normalize
        .expandDims(0),
    );

    await model.net.executeAsync(input).then((res) => {
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

  detectFrame(); // initialize to detect every frame
};

export { detect };
