import * as tf from '@tensorflow/tfjs';
import { useState } from 'react';

const weights = '../tfjs_models/weights.json';

export default function PlateDetector() {
  const [model, setModel] = useState(null);
  useEffect(() => {
    tf.loadGraphModel(weights).then((model) => {
      setModel({ model });
    });
  });

  return model;
}
