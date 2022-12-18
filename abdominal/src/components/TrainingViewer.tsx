import { Chip, Typography } from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // set backend to webgl
import { io } from '@tensorflow/tfjs-core';
import { useEffect, useRef, useState } from 'react';
import MultiCameraViewer from './MultiCameraViewer';
import RepCount from './RepCount';
import Loader from './yolov5/components/loader';
import WebcamOpenButton from './yolov5/components/WebcamOpenButton';
import './yolov5/style/App.css';
import labels from './yolov5/utils/labels.json';
import renderBoxes from './yolov5/utils/renderBox';

export type Model = {
  net: tf.GraphModel<string | tf.io.IOHandler>;
  inputShape: number[];
};

interface EstimateWeightProps {
  threshold: number;
  boxesData: number[];
  scoresData: number[];
  classesData: number[];
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

function TrainingViewer() {
  // webcam preparation
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // ******** for weight detector *********
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [weight, setWeight] = useState(0);
  const [plates, setPlates] = useState<string[]>([]);
  const [doingExercise, setDoingExercise] = useState(false);

  const [model, setModel] = useState<Model>({
    net: null as unknown as tf.GraphModel<string | io.IOHandler>,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height

  // configs
  const modelName = 'yolov5n';
  const threshold = 0.25;
  // ******** for weight detector *********

  /**
   * Function to detect every frame loaded from webcam in video tag.
   * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
   */
  const detectFrame = async () => {
    if (videoRef.current == null || canvasRef.current == null) return; // handle if source is null

    tf.engine().startScope();
    const input = tf.tidy(() =>
      tf.image
        .resizeBilinear(tf.browser.fromPixels(videoRef.current), [modelWidth, modelHeight])
        .div(255.0)
        .expandDims(0),
    );

    await model.net.executeAsync(input).then((result) => {
      if (!Array.isArray(result)) throw new Error('Model output is not an array');
      const [boxes, scores, classes] = result.slice(0, 3);
      const boxesData = boxes.dataSync() as unknown as number[];
      const scoresData = scores.dataSync() as unknown as number[];
      const classesData = classes.dataSync() as unknown as number[];
      const estimatedWeight = estimateWeight({ threshold, boxesData, scoresData, classesData });
      if (estimatedWeight.weight !== weight || estimatedWeight.barbellCenterZ !== 0) {
        setWeight(estimatedWeight.weight);
        setPlates(estimatedWeight.plates);
        setDoingExercise(estimatedWeight.barbellCenterZ < 0.5);
      }
      renderBoxes(canvasRef.current, threshold, boxesData, scoresData, classesData);
      tf.dispose(result);
    });

    requestAnimationFrame(detectFrame); // get another frame
    tf.engine().endScope();
  };

  // initialize ml model
  useEffect(() => {
    // load yolov5 model & warming up
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
  }, []);

  return (
    <>
      <div className="WeightDetector">
        {loading.loading ? (
          <Loader>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>
        ) : (
          <Typography>Currently running model : YOLOv5{modelName.slice(6)}</Typography>
        )}
        <div className="content">
          <video autoPlay playsInline muted ref={videoRef} onPlay={detectFrame} />
          <canvas width={640} height={640} ref={canvasRef} />
        </div>
        <Typography>Estimated Weight: {weight}</Typography>
        <Typography>Detected Plate: {plates.map((p) => `${p} `)}</Typography>
        {doingExercise ? (
          <Chip label="WORKOUT" sx={{ fontSize: 40 }} />
        ) : (
          <Chip label="REST" variant="outlined" sx={{ fontSize: 40 }} />
        )}
        <WebcamOpenButton cameraRef={videoRef} />
      </div>
      <MultiCameraViewer />
      <RepCount doingExercise={doingExercise} />
    </>
  );
}

export default TrainingViewer;
