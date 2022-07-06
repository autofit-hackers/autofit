import TrainingRep from "./trainingRep";

class TrainingSet {
    reps: TrainingRep[];
    menu: string;
    weight: number;

    constructor(menu: string, weight: number) {
        this.reps = [];
        this.menu = menu;
        this.weight = weight;
    }

    createNewRep = (): void => {
        let idx = this.reps.length + 1;
        this.reps.push(new TrainingRep(idx));
    };
}

export default TrainingSet;
