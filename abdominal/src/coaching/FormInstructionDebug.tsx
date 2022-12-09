import ReactECharts from 'echarts-for-react';

export type GraphThreshold = { upper: number; middle: number; lower: number };

export type FrameEvaluateParams = {
  name: string;
  threshold: GraphThreshold;
  evaluatedValues: number[];
};

export type EvaluatedFrames = FrameEvaluateParams[];

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
