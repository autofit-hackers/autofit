import { Session } from '../training';

export const dummySession = {
  id: '1',
  name: 'Session 1',
  description: 'Session 1 description',
  date: '2020-01-01',
  time: '10:00',
  duration: 60,
  level: 'Beginner',
  presenter: 'John Doe',
  abstract: 'Session 1 abstract',
  voters: ['johnpapa', 'bradgreen', 'igorminar'],
};

export const dummySessions: Session[] = [
  {
    id: '1',
    name: 'Session 1',
    description: 'Session 1 description',
    date: '2020-01-01',
    time: '10:00',
    duration: 60,
    thumbnailUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat_2.jpg',
    workoutNames: ['ベンチプレス', 'スクワット'],
    bodyPartNames: ['Chest', 'Back'],
  },
  {
    id: '2',
    name: 'Session 2',
    description: 'Session 2 description',
    date: '2020-01-02',
    time: '11:00',
    duration: 60,
    thumbnailUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat_1.jpg',
    workoutNames: ['スクワット'],
    bodyPartNames: ['Legs', 'Shoulders'],
  },
  {
    id: '3',
    name: 'Session 3',
    description: 'Session 3 description',
    date: '2020-01-03',
    time: '12:00',
    duration: 60,
    thumbnailUrl: 'https://abdominal-development.s3.us-west-2.amazonaws.com/ueno/squat_2.jpg',
    workoutNames: ['デッドリフト'],
    bodyPartNames: ['Arms', 'Abs'],
  },
];
