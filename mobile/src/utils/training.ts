export type WorkoutMenu = {
  id: string;
  name: string;
  imageUrl: string;
};

export type Session = {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  date: string;
  time: string;
  duration: number;
  summaryComment?: string;
  trainerId?: string;
  maxWeight: number;
  reps: number;
  workoutNames: string[];
  bodyPartNames: string[];
};

export type Set = {
  id: string;
  sessionId: string;
  reps: number;
  rest: number;
  weight: number;
  workoutName: string;
  videoUrl: string;
};

export type Comment = {
  id: string;
  trainerId: string;
  setId: string;
  comment: string;
};

export type Trainer = {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
};

export function getOneRepMax(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function getOneRepMaxFromSets(sets: Set[]): number {
  const oneRepMaxes = sets.map((set) => getOneRepMax(set.weight, set.reps));

  return Math.max(...oneRepMaxes);
}
