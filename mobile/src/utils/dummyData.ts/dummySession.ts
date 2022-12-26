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
    thumbnailUrl: 'https://picsum.photos/200/300',
    workoutNames: ['Workout 1', 'Workout 2'],
    bodyPartNames: ['Chest', 'Back'],
  },
  {
    id: '2',
    name: 'Session 2',
    description: 'Session 2 description',
    date: '2020-01-02',
    time: '11:00',
    duration: 60,
    thumbnailUrl: 'https://picsum.photos/200/300',
    workoutNames: ['Workout 3', 'Workout 4'],
    bodyPartNames: ['Legs', 'Shoulders'],
  },
  {
    id: '3',
    name: 'Session 3',
    description: 'Session 3 description',
    date: '2020-01-03',
    time: '12:00',
    duration: 60,
    thumbnailUrl: 'https://picsum.photos/200/300',
    workoutNames: ['Workout 5', 'Workout 6'],
    bodyPartNames: ['Arms', 'Abs'],
  },
];
