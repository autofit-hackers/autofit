import ReactECharts from 'echarts-for-react';
import { GraphThreshold } from '../../coaching/FormInstructionDebug';

function RealtimeChart(props: {
  data: number[];
  thresh: GraphThreshold;
  realtimeUpdate: boolean;
  size: 'large' | 'small';
}) {
  const { data, thresh, realtimeUpdate, size } = props;

  const op = {
    innerHeight: '100vh',
    xAxis: realtimeUpdate
      ? {
          type: 'category',
          data: data.map((v, i) => i),
          min: data.length - 301,
          max: data.length - 1,
        }
      : { type: 'category' },
    yAxis: realtimeUpdate
      ? {
          type: 'value',
          min: (thresh.lower - thresh.middle) * 2 + thresh.middle,
          max: (thresh.upper - thresh.middle) * 2 + thresh.middle,
        }
      : { type: 'value' },
    // legend: realtimeUpdate ? { data: ['ももの角度'] } : {},
    series: [
      {
        name: 'ももの角度',
        data,
        type: 'line',
        itemStyle: { normal: { color: 'blue' } },
        smooth: true,
        markLine: {
          data: [
            { yAxis: thresh.upper, name: '上限', lineStyle: { color: 'red' } },
            { yAxis: thresh.middle, name: '適正', lineStyle: { color: 'green' } },
            { yAxis: thresh.lower, name: '下限', lineStyle: { color: 'red' } },
          ],
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={op}
      style={{
        marginTop: size === 'large' ? '10vw' : '0',
        height: size === 'large' ? '50vw' : '30vw',
        backgroundColor: 'white',
      }}
    />
  );
}

export default RealtimeChart;

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
