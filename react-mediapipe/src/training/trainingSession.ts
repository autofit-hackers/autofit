import TrainingExercise from "./trainingExercise";

class TrainingSession{
    userId: string;
    trainingExercises: TrainingExercise[];

    constructor(userId: string) {
        this.userId = userId;
        this.trainingExercises = [];
    }

    createNewExercise = (): void => {
        this.trainingExercises.push(new TrainingExercise("userId"));
    };
}

export default TrainingSession