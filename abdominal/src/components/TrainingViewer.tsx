import { Button, CardMedia, Stack, Typography } from '@mui/material';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // set backend to webgl
import { io } from '@tensorflow/tfjs-core';
import { useEffect, useRef, useState } from 'react';
import estimateWeight from '../utils/barbellEstimator';
import mediaRecorder from '../utils/recorder';
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
  const barbellVideoRecorderRef = useRef<MediaRecorder>();
  const subVideoRef = useRef<HTMLVideoElement>(null);
  const subVideoRecorderRef = useRef<MediaRecorder>();
  const sub2VideoRef = useRef<HTMLVideoElement>(null);
  const sub2VideoRecorderRef = useRef<MediaRecorder>();

  // リプレイ
  const [replayBlobURL, setReplayBlobURL] = useState<string | null>(null);
  const [replaySubBlobURL, setReplaySubBlobURL] = useState<string | null>(null);
  const [replaySub2BlobURL, setReplaySub2BlobURL] = useState<string | null>(null);

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
    // バーベルカメラの録画
    if (doingExercise && barbellVideoRef.current != null) {
      barbellVideoRecorderRef.current = mediaRecorder(barbellVideoRef.current, 'barbell', setReplayBlobURL);
      barbellVideoRecorderRef.current.start();
    } else if (
      !doingExercise &&
      barbellVideoRecorderRef.current != null &&
      barbellVideoRecorderRef.current.state === 'recording'
    ) {
      barbellVideoRecorderRef.current.stop();
    }

    // サブカメラの録画
    if (doingExercise && subVideoRef.current != null) {
      subVideoRecorderRef.current = mediaRecorder(subVideoRef.current, 'sub', setReplaySubBlobURL);
      subVideoRecorderRef.current.start();
    } else if (
      !doingExercise &&
      subVideoRecorderRef.current != null &&
      subVideoRecorderRef.current.state === 'recording'
    ) {
      subVideoRecorderRef.current.stop();
    }

    // サブカメラ2の録画
    if (doingExercise && sub2VideoRef.current != null) {
      sub2VideoRecorderRef.current = mediaRecorder(sub2VideoRef.current, 'sub2', setReplaySub2BlobURL);
      sub2VideoRecorderRef.current.start();
    } else if (
      !doingExercise &&
      sub2VideoRecorderRef.current != null &&
      sub2VideoRecorderRef.current.state === 'recording'
    ) {
      sub2VideoRecorderRef.current.stop();
    }
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
            <canvas ref={barbellCanvasRef} />
          </div>
        </div>

        <Stack direction="column">
          <video
            autoPlay
            playsInline
            muted
            ref={subVideoRef}
            style={{
              display: 'none',
              maxWidth: '720px',
              maxHeight: '500px',
              borderRadius: '10px',
              transform: 'rotate(90deg)',
              marginBlock: '160px',
            }}
          />
          <WebcamOpenButton cameraRef={subVideoRef} />
        </Stack>
        <Stack direction="column">
          <video
            autoPlay
            playsInline
            muted
            ref={sub2VideoRef}
            style={{
              display: 'none',
              maxWidth: '720px',
              maxHeight: '500px',
              borderRadius: '10px',
              transform: 'rotate(90deg)',
              marginBlock: '160px',
            }}
          />
          <WebcamOpenButton cameraRef={sub2VideoRef} />
        </Stack>
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
      <Stack direction="row">
        {replayBlobURL != null ? (
          <CardMedia
            component="video"
            src={replayBlobURL}
            controls
            autoPlay
            loop
            sx={{ transform: 'rotate(90deg)' }}
          />
        ) : null}
        {replaySubBlobURL != null ? (
          <CardMedia
            component="video"
            src={replaySubBlobURL}
            controls
            autoPlay
            loop
            sx={{ transform: 'rotate(90deg)' }}
          />
        ) : null}
        {replaySub2BlobURL != null ? (
          <CardMedia
            component="video"
            src={replaySub2BlobURL}
            controls
            autoPlay
            loop
            sx={{ transform: 'rotate(90deg)' }}
          />
        ) : null}
      </Stack>
    </>
  );
}

export default TrainingViewer;
