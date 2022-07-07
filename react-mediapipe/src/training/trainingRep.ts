import Pose from './pose';

class TrainingRep {
    form: Pose[];
    bodyHeights: number[];
    keyframes: { [key: string]: number };
    repNumber: number;

    constructor(repNumber: number) {
        this.form = [];
        this.bodyHeights = [];
        this.keyframes = {};
        this.repNumber = repNumber;
    }

    recordPose(pose: Pose): void {
        this.form.push(pose);
        // HACK: unlock this? => this.body_heights.push(pose.get_2d_height());
    }

    resetRep = (repNumber: number): void => {
        this.form = [];
        this.keyframes = {};
        this.repNumber = repNumber;
    };

    recalculateKeyframes = (): { [key: string]: number } => {
        this.bodyHeights = this.form.map((pose) => pose.height());
        // calculate top
        const topHeight = Math.max(...this.bodyHeights);
        const topIdx = this.bodyHeights.indexOf(topHeight);
        this.keyframes.top = topIdx;
        // calculate bottom
        const bottomHeight = Math.min(...this.bodyHeights);
        const bottomIdx = this.bodyHeights.indexOf(bottomHeight);
        this.keyframes.bottom = bottomIdx;
        // top should be before bottom
        if (topIdx < bottomIdx) {
            const middleHeight = (topHeight + bottomHeight) / 2;
            // calculate descending_middle
            let descendingMiddleIdx = topIdx;
            while (this.bodyHeights[descendingMiddleIdx] > middleHeight) {
                descendingMiddleIdx += 1;
            }
            this.keyframes.descending_middle = descendingMiddleIdx;
            // calculate ascending_middle
            let ascendingMiddleIdx = bottomIdx;
            while (
                this.bodyHeights[ascendingMiddleIdx] < middleHeight &&
                ascendingMiddleIdx < this.bodyHeights.length - 1
            ) {
                ascendingMiddleIdx += 1;
            }
            this.keyframes.ascending_middle = ascendingMiddleIdx;
        }
        return this.keyframes;
    };

    getKeyframePose(key: string): Pose {
        return this.form[this.keyframes[key]];
    }
}

export default TrainingRep;
