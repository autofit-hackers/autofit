import { KJ, Pose } from '../training_data/pose';

class TrainingPhase {
  public phase: 'outOfPosition' | 'countdown' | 'exercising';
  public text = '';
  private acceptableRange: number;
  private timer: NodeJS.Timer | undefined;
  public timerCount: number;
  private timerDuration = 3;
  private isTimerStarted = false;

  constructor(acceptableRange: number, timerDuration: number) {
    this.phase = 'outOfPosition';
    this.acceptableRange = acceptableRange;
    this.timerDuration = timerDuration;
    this.timerCount = this.timerDuration;
  }

  updateInPreparation(currentPose: Pose) {
    const distanceFromStartPosition = currentPose.worldLandmarks[KJ.PELVIS].z; // 後ろに下がるほど大きな値になる
    if (distanceFromStartPosition > this.acceptableRange) {
      this.text = `あと${Math.abs(distanceFromStartPosition - this.acceptableRange).toFixed(0)}cm前に出てください`;
    } else if (distanceFromStartPosition < -this.acceptableRange) {
      this.text = `あと${Math.abs(distanceFromStartPosition + this.acceptableRange).toFixed(
        0,
      )}cm後ろに下がってください`;
    } else {
      this.phase = 'countdown';
    }
  }

  resetTimerCount() {
    this.timerCount = this.timerDuration;
    this.isTimerStarted = false;
  }

  updateInCountDown(currentPose: Pose) {
    const distanceFromStartPosition = currentPose.worldLandmarks[KJ.PELVIS].z; // 後ろに下がるほど大きな値になる
    this.text = `開始まであと${this.timerCount}秒です`;

    // スタートポジションにいる場合
    if (distanceFromStartPosition < Math.abs(this.acceptableRange)) {
      if (!this.isTimerStarted) {
        this.isTimerStarted = true;
        // タイマーを開始する
        this.timer = setInterval(() => {
          this.timerCount -= 1;
          if (this.timerCount <= 0) {
            this.phase = 'exercising';
            this.text = 'トレーニング開始';
            this.resetTimerCount();
            clearInterval(this.timer);
          }
        }, 1000);
      }
    } else {
      // スタートポジションから外れた場合、1つ前のphaseに戻す
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.phase = 'outOfPosition';
      this.resetTimerCount();
    }
  }
}

export default TrainingPhase;
