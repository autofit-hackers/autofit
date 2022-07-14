import { NormalizedLandmark, NormalizedLandmarkList, Results } from '@mediapipe/pose';

class Pose {
    landmark: NormalizedLandmarkList;

    constructor(result: Results) {
        this.landmark = result.poseLandmarks;
    }

    neckCenter = (): NormalizedLandmark => ({
        x: (this.landmark[11].x + this.landmark[12].x) / 2,
        y: (this.landmark[11].y + this.landmark[12].y) / 2,
        z: (this.landmark[11].z + this.landmark[12].z) / 2
    });

    hipCenter = (): NormalizedLandmark => ({
        x: (this.landmark[23].x + this.landmark[24].x) / 2,
        y: (this.landmark[23].y + this.landmark[24].y) / 2,
        z: (this.landmark[23].z + this.landmark[24].z) / 2
    });

    kneeCenter = (): NormalizedLandmark => ({
        x: (this.landmark[25].x + this.landmark[26].x) / 2,
        y: (this.landmark[25].y + this.landmark[26].y) / 2,
        z: (this.landmark[25].z + this.landmark[26].z) / 2
    });

    footCenter = (): NormalizedLandmark => ({
        x: (this.landmark[27].x + this.landmark[28].x) / 2,
        y: (this.landmark[27].y + this.landmark[28].y) / 2,
        z: (this.landmark[27].z + this.landmark[28].z) / 2
    });

    kneesDistance = (): number => {
        const kneeLeft = this.landmark[25];
        const kneeRight = this.landmark[26];

        return Math.sqrt((kneeLeft.x - kneeRight.x) ** 2 + (kneeLeft.y - kneeRight.y) ** 2);
    };

    handsDistance = (): number => {
        const handLeft = this.landmark[15];
        const handRight = this.landmark[16];

        return Math.sqrt((handLeft.x - handRight.x) ** 2 + (handLeft.y - handRight.y) ** 2);
    };

    height = (): number => {
        const neck = this.neckCenter();
        const foot = this.footCenter();

        return Math.sqrt((neck.x - foot.x) ** 2 + (neck.y - foot.y) ** 2);
    };
}

export default Pose;
