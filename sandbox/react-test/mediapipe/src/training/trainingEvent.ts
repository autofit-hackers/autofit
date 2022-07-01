import TrainingSet from "./trainingSet";

class TrainingEvent {
    userId: string;
    trainingSets: TrainingSet[];

    constructor(public user_id: string) {
        this.userId = user_id;
        this.trainingSets = [];
    }

    createNewSet = (): void => {
        this.trainingSets.push(new TrainingSet("menu", 60));
    };
}

export default TrainingEvent;
