import Pose from "./pose";

class RepState {
    repCount: number = 0;
    isLiftingUp: boolean = false;
    didTouchBottom: boolean = false;
    didTouchTop: boolean = true;
    initialBodyHeight: number = 0;
    tmpBodyHeights: number[] = [];

    private initRep = (height: number) => {
        this.initialBodyHeight = height;
        this.tmpBodyHeights = new Array<number>(10);
        for (let i = 0; i < 10; i++) {
            this.tmpBodyHeights[i] = this.initialBodyHeight;
        }
    };

    updateRepCount = (pose: Pose, lowerThreshold: number, upperThreshold: number) => {
        const height: number = pose.height();
        if (this.tmpBodyHeights.length < 10) {
            this.initRep(height);
        }
        const has_count_upped = this.checkIfRepFinished(height, lowerThreshold, upperThreshold);
        this.updateLiftingState(height);
        return has_count_upped;
    };

    private checkIfRepFinished = (
        height: number,
        lowerThreshold: number,
        upperThreshold: number,
    ): boolean => {
        if (!this.didTouchBottom && height < this.initialBodyHeight * lowerThreshold) {
            this.didTouchBottom = true;
        } else if (this.didTouchBottom && height > this.initialBodyHeight * upperThreshold) {
            this.repCount += 1;
            this.didTouchBottom = false;
            return true;
        }
        return false;
    };

    private updateLiftingState = (height: number): void => {
        this.tmpBodyHeights.shift();
        this.tmpBodyHeights.push(height);
    };

    isKeyframe = (pose: Pose, lowerThreshold: number, upperThreshold: number) => {
        const height: number = pose.height();
        if (this.didTouchTop && height < this.initialBodyHeight * lowerThreshold) {
            this.didTouchTop = false;
            return true;
        } else if (!this.didTouchTop && height > this.initialBodyHeight * upperThreshold) {
            this.didTouchTop = true;
            return false;
        } else {
            return false;
        }
    };

    // TODO: implement alternative of body_heights_df in training_set.py
    resetRep(pose: Pose): void {
        this.repCount = 0;
        this.isLiftingUp = false;
        this.didTouchBottom = false;
        this.didTouchTop = true;
        this.initialBodyHeight = pose.height();
        for (let i = 0; i < 10; i++) {
            this.tmpBodyHeights[i] = this.initialBodyHeight;
        }
    }
}

export default RepState;
