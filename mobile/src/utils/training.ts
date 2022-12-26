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
  workoutNames: string[];
  bodyPartNames: string[];
};

export type Set = {
  id: string;
  sessionId: string;
  reps: number;
  rest: number;
  weight: number;
  videoUrl: string;
};

export type Comment = {
  id: string;
  trainerId: string;
  setId: string;
  comment: string;
};
