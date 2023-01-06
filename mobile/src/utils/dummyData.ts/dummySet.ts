import { Set } from '../training';

export const dummySet = {
  id: '1',
  sessionId: '1',
  reps: 10,
  rest: 60,
  weight: 100,
  videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
};

export const dummySets: Set[] = [
  {
    id: '1',
    sessionId: '1',
    reps: 6,
    rest: 60,
    weight: 50,
    workoutName: 'ベンチプレス',
    videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  },
  {
    id: '2',
    sessionId: '1',
    reps: 8,
    rest: 60,
    weight: 60,
    workoutName: 'ベンチプレス',
    videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  },
  {
    id: '3',
    sessionId: '1',
    reps: 10,
    rest: 60,
    weight: 100,
    workoutName: 'スクワット',
    videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  },
];
