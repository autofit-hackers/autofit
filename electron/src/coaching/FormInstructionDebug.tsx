import { Landmark } from '@mediapipe/pose';
import ReactECharts from 'echarts-for-react';
import { getAngle, getDistance, normalizeAngle, Pose } from '../training_data/pose';
import { Rep } from '../training_data/rep';
import KJ from '../utils/kinectJoints';

export type FrameEvaluateParams = {
  threshold: { upper: number; center: number; lower: number };
  targetArray: number[];
};

export type EvaluatedFrames = {
  [key: string]: FrameEvaluateParams;
};

export const evaluateFrame = (currentPose: Pose, prevRep: Rep, evaluatedFrames: EvaluatedFrames): EvaluatedFrames => {
  // kneeInAndOut
  const openingOfKnee = normalizeAngle(
    getAngle(currentPose.worldLandmarks[KJ.HIP_LEFT], currentPose.worldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(currentPose.worldLandmarks[KJ.HIP_RIGHT], currentPose.worldLandmarks[KJ.KNEE_RIGHT]).zx,
    true,
  );

  let topToe = 0;
  if (prevRep !== undefined && prevRep.keyframesIndex !== undefined && prevRep.keyframesIndex.top !== undefined) {
    const topWorldLandmarks = prevRep.form[prevRep.keyframesIndex.top].worldLandmarks as Landmark[];
    topToe =
      getAngle(topWorldLandmarks[KJ.ANKLE_LEFT], topWorldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(topWorldLandmarks[KJ.ANKLE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).zx;
  }
  const kneeInAndOutData: FrameEvaluateParams = {
    threshold: { upper: topToe + 40, center: topToe + 20, lower: topToe + 10 },
    targetArray: evaluatedFrames.kneeInAndOut.targetArray.concat([openingOfKnee]),
  };

  let kneeFrontDiff = 0;
  if (prevRep !== undefined && prevRep.keyframesIndex !== undefined && prevRep.keyframesIndex.top !== undefined) {
    const topWorldLandmarks = prevRep.form[prevRep.keyframesIndex.top].worldLandmarks as Landmark[];
    kneeFrontDiff = getDistance(currentPose.worldLandmarks[KJ.KNEE_RIGHT], topWorldLandmarks[KJ.FOOT_RIGHT]).z;
  }
  const kneeFrontAndBackData: FrameEvaluateParams = {
    threshold: { upper: 150, center: 0, lower: -150 },
    targetArray: evaluatedFrames.kneeFrontAndBack.targetArray.concat([kneeFrontDiff]),
  };

  return {
    kneeInAndOut: kneeInAndOutData,
    kneeFrontAndBack: kneeFrontAndBackData,
  };
};

export const getOpeningOfKnee = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.HIP_LEFT], pose.worldLandmarks[KJ.KNEE_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.HIP_RIGHT], pose.worldLandmarks[KJ.KNEE_RIGHT]).zx,
    true,
  );

export const getOpeningOfToe = (pose: Pose): number =>
  normalizeAngle(
    getAngle(pose.worldLandmarks[KJ.ANKLE_LEFT], pose.worldLandmarks[KJ.FOOT_LEFT]).zx -
      getAngle(pose.worldLandmarks[KJ.ANKLE_RIGHT], pose.worldLandmarks[KJ.FOOT_RIGHT]).zx,
    true,
  );

export function ManuallyAddableChart(props: { data: number[][] }) {
  const { data } = props;

  const op = {
    innerHeight: '100vh',
    xAxis: {
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
    legend: { data: ['もも', '足'] },
    series: [
      {
        name: 'もも',
        data: data[0],
        type: 'line',
        itemStyle: { normal: { color: 'red' } },
        smooth: true,
        markLine: {
          data: [{ type: 'average', name: '平均' }],
        },
      },
      {
        name: '足',
        data: data[1],
        type: 'line',
        itemStyle: { normal: { color: 'blue' } },
        smooth: true,
        markLine: {
          data: [{ type: 'average', name: '平均' }],
        },
      },
    ],
  };

  return <ReactECharts option={op} style={{ marginTop: 100, height: '60vw', backgroundColor: 'white' }} />;
}
