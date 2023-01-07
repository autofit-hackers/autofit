import { Set } from '../training';

export const dummySet = {
  id: '1',
  sessionId: '1',
  reps: 10,
  rest: 60,
  weight: 100,
  videoUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat.mov',
};

export const dummySets: Set[] = [
  {
    id: '1',
    sessionId: '1',
    reps: 6,
    rest: 60,
    weight: 50,
    workoutName: 'ベンチプレス',
    videoUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat.mov',
  },
  {
    id: '2',
    sessionId: '1',
    reps: 8,
    rest: 60,
    weight: 60,
    workoutName: 'ベンチプレス',
    videoUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat.mov',
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
  {
    id: '4',
    sessionId: '2',
    reps: 6,
    rest: 60,
    weight: 50,
    workoutName: 'ベンチプレス',
    videoUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat.mov',
  },
  {
    id: '5',
    sessionId: '2',
    reps: 8,
    rest: 60,
    weight: 60,
    workoutName: 'ベンチプレス',
    videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  },
  {
    id: '6',
    sessionId: '3',
    reps: 10,
    rest: 60,
    weight: 100,
    workoutName: 'スクワット',
    videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
  },
];
