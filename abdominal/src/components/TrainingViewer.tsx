import { Stack, Typography } from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // set backend to webgl
import { io } from '@tensorflow/tfjs-core';
import { useEffect, useRef, useState } from 'react';
import estimateWeight from '../utils/barbellEstimator';
import { mediaRecorder } from '../utils/recorder';
import PoseEstimator from './PoseEstimator';
import Loader from './yolov5/components/loader';
import WebcamOpenButton from './yolov5/components/WebcamOpenButton';
import './yolov5/style/App.css';
import renderBoxes from './yolov5/utils/renderBox';

export type Model = {
  net: tf.GraphModel<string | tf.io.IOHandler>;
  inputShape: number[];
};

function TrainingViewer() {
  // ******** for weight detector *********
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const barbellVideoRef = useRef<HTMLVideoElement>(null);
  const barbellCanvasRef = useRef<HTMLCanvasElement>(null);
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

  // 録画
  const frontVideoRecorderRef = useRef<MediaRecorder>();

  /**
   * Function to detect every frame loaded from webcam in video tag.
   * @param {tf.GraphModel} model loaded YOLOv5 tensorflow.js model
   */
  const detectFrame = async () => {
    if (barbellVideoRef.current == null) return; // handle if source is null

    tf.engine().startScope();
    const input = tf.tidy(() =>
      tf.image
        .resizeBilinear(tf.browser.fromPixels(barbellVideoRef.current as HTMLVideoElement), [modelWidth, modelHeight])
        .div(255.0)
        .expandDims(0),
    );

    await model.net.executeAsync(input).then((result) => {
      if (!Array.isArray(result)) throw new Error('Model output is not an array');
      if (barbellCanvasRef.current == null) throw new Error('Canvas is null or undefined');
      const [boxes, scores, classes] = result.slice(0, 3);
      const boxesData = boxes.dataSync();
      const scoresData = scores.dataSync();
      const classesData = classes.dataSync();
      const estimatedWeight = estimateWeight({ threshold, boxesData, scoresData, classesData });
      if (estimatedWeight.weight !== weight || estimatedWeight.barbellCenterZ !== 0) {
        setWeight(estimatedWeight.weight);
        setPlates(estimatedWeight.plates);
        setDoingExercise(estimatedWeight.barbellCenterZ < 0.5);
      }
      renderBoxes(barbellCanvasRef.current, threshold, boxesData, scoresData, classesData);
      tf.dispose(result);
    });

    // WARN: how to handle this error?
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    requestAnimationFrame(detectFrame); // get another frame
    tf.engine().endScope();
  };

  // doingExerciseが変更されたら録画を開始・終了する
  useEffect(() => {
    if (doingExercise && barbellVideoRef.current != null) {
      frontVideoRecorderRef.current = mediaRecorder(barbellVideoRef.current, 'front');
      frontVideoRecorderRef.current.start();
    }
    if (
      !doingExercise &&
      frontVideoRecorderRef.current != null &&
      frontVideoRecorderRef.current.state === 'recording'
    ) {
      frontVideoRecorderRef.current.stop();
    }
    console.log(doingExercise);
  }, [doingExercise]);

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
      {loading.loading ? (
        <Loader style={{ top: 0, height: '10vh' }}>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>
      ) : null}
      <Stack direction="row" spacing={2}>
        <div className="WeightDetector">
          <div className="content">
            {/* WARN: how to handle this error? */}
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <video autoPlay playsInline muted ref={barbellVideoRef} onPlay={detectFrame} />
            <canvas width={640} height={640} ref={barbellCanvasRef} />
          </div>
        </div>
        <PoseEstimator doingExercise={doingExercise} />
      </Stack>

      <Typography
        variant="h3"
        sx={{
          position: 'fixed',
          right: '5vw',
          bottom: '43vh',
          zIndex: 9,
          border: 3,
          paddingBlock: 1.5,
          paddingInline: 4,
          borderRadius: 3,
          backgroundColor: doingExercise ? 'black' : 'white',
          color: doingExercise ? 'white' : 'black',
        }}
      >
        {doingExercise ? 'WORKOUT' : 'REST'}
      </Typography>
      <Typography>Estimated Weight: {weight}</Typography>
      <Typography>Detected Plate: {plates.map((p) => `${p} `)}</Typography>
      <WebcamOpenButton cameraRef={barbellVideoRef} />
    </>
  );
}

export default TrainingViewer;
