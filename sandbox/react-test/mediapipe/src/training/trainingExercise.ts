import TrainingSet from "./trainingSet";

class TrainingExercise {
    userId: string;
    trainingSets: TrainingSet[];

    constructor(userId: string) {
        this.userId = userId;
        this.trainingSets = [];
    }

    createNewSet = (): void => {
        this.trainingSets.push(new TrainingSet("menu", 60));
    };
}

export default TrainingExercise;
