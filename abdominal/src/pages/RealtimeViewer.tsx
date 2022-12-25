import { Button, Typography } from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // set backend to webgl
import { io } from '@tensorflow/tfjs-core';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactWebcam from 'react-webcam';
import WebcamAF from '../components/camera/WebcamAF';
import estimateWeight from '../components/ml-models/barbellEstimator';
import Loader from '../components/ml-models/loader';
import renderBoxes from '../components/ml-models/renderBox';

export type Model = {
  net: tf.GraphModel<string | tf.io.IOHandler>;
  inputShape: number[];
};

function TrainingViewer() {
  // ******** for weight detector *********
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const webcamRef = useRef<ReactWebcam>(null);
  const BoxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [weight, setWeight] = useState(0);
  const [plates, setPlates] = useState<string[]>([]);
  const [doingExercise, setDoingExercise] = useState(false);

  const [model, setModel] = useState<Model>({
    net: null as unknown as tf.GraphModel<string | io.IOHandler>,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // get model width and height
  const boxesData = useRef<Float32Array | Int32Array | Uint8Array>();
  const scoresData = useRef<Float32Array | Int32Array | Uint8Array>();
  const classesData = useRef<Float32Array | Int32Array | Uint8Array>();

  // configs
  const modelName = 'yolov5n';
  const threshold = 0.25;
  // ******** for weight detector *********

  // 録画
  const frontVideoRecorderRef = useRef<MediaRecorder>();

  const detectFrame = useCallback(
    async (cameraCanvas: HTMLCanvasElement) => {
      if (cameraCanvas === null) return;
      if (model.net == null) throw new Error('Model is null or undefined');
      if (BoxCanvasRef.current == null) throw new Error('Canvas is null or undefined');
      BoxCanvasRef.current.width = cameraCanvas.width;
      BoxCanvasRef.current.height = cameraCanvas.height;

      renderBoxes(BoxCanvasRef.current, threshold, boxesData.current, scoresData.current, classesData.current);
      tf.engine().startScope();
      const input = tf.tidy(() =>
        tf.image
          .resizeBilinear(tf.browser.fromPixels(cameraCanvas), [modelWidth, modelHeight])
          .div(255.0)
          .expandDims(0),
      );

      await model.net.executeAsync(input).then((result) => {
        if (!Array.isArray(result)) throw new Error('Model output is not an array');
        if (BoxCanvasRef.current == null) throw new Error('Canvas is null or undefined');
        const [boxes, scores, classes] = result.slice(0, 3);
        boxesData.current = boxes.dataSync();
        scoresData.current = scores.dataSync();
        classesData.current = classes.dataSync();
        const estimatedWeight = estimateWeight({
          threshold,
          boxesData: boxesData.current,
          scoresData: scoresData.current,
          classesData: classesData.current,
        });
        if (estimatedWeight.weight !== weight || estimatedWeight.barbellCenterZ !== 0) {
          setWeight(estimatedWeight.weight);
          setPlates(estimatedWeight.plates);
          setDoingExercise(estimatedWeight.barbellCenterZ < 0.5);
        }
        tf.dispose(result);
      });

      tf.engine().endScope();
    },
    [model.net, modelHeight, modelWidth, weight],
  );

  // doingExerciseが変更されたら録画を開始・終了する
  useEffect(() => {
    if (doingExercise && webcamRef.current != null && webcamRef.current.video != null) {
      // WARN: 一時的にコメントアウト
      // frontVideoRecorderRef.current = mediaRecorder(webcamRef.current.video, 'front');
      // frontVideoRecorderRef.current.start();
    }
    if (
      !doingExercise &&
      frontVideoRecorderRef.current != null &&
      frontVideoRecorderRef.current.state === 'recording'
    ) {
      frontVideoRecorderRef.current.stop();
    }
  }, [doingExercise]);

  // Initialize ML model
  useEffect(() => {
    tf.ready()
      .then(async () => {
        const yolov5 = await tf.loadGraphModel(`${window.location.origin}/${modelName}_web_model/model.json`, {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        });

        if (yolov5.inputs[0].shape == null) {
          throw new Error('Invalid model input shape');
        }
        const dummyInput = tf.ones(yolov5.inputs[0].shape);
        const warmupResult = await yolov5.executeAsync(dummyInput);
        tf.dispose(warmupResult); // cleanup memory
        tf.dispose(dummyInput); // cleanup memory

        setLoading({ loading: false, progress: 1 });
        setModel({
          net: yolov5,
          inputShape: yolov5.inputs[0].shape,
        });
      })
      .catch((err) => {
        throw err;
      });
  }, []);

  return (
    <>
      {loading.loading ? (
        <Loader style={{ top: 0, height: '10vh' }}>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>
      ) : (
        <div style={{ position: 'relative' }}>
          <WebcamAF
            webcamRef={webcamRef}
            onFrame={detectFrame}
            inputWidth={720}
            inputHeight={480}
            rotation="left"
            style={{
              zIndex: 1,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
          <canvas
            ref={BoxCanvasRef}
            style={{
              zIndex: 2,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </div>
      )}

      {/* WARN: テストのため一旦コメントアウト */}
      {/* <PoseEstimator doingExercise={doingExercise} /> */}
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

      <Button
        onClick={() => {
          setDoingExercise(true);
        }}
      >
        Start
      </Button>
      <Button
        onClick={() => {
          setDoingExercise(false);
        }}
      >
        Stop
      </Button>
    </>
  );
}

export default TrainingViewer;
