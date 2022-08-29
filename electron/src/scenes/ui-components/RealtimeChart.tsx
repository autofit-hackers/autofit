import ReactECharts from 'echarts-for-react';

function RealtimeChart(props: { data: number[]; thresh: { upper: number; center: number; lower: number } }) {
  const { data, thresh } = props;

  const op = {
    innerHeight: '100vh',
    xAxis: {
      type: 'category',
      data: data.map((v, i) => i),
      min: data.length - 101,
      max: data.length - 1,
    },
    yAxis: {
      type: 'value',
      min: (thresh.lower - thresh.center) * 2 + thresh.center,
      max: (thresh.upper - thresh.center) * 2 + thresh.center,
    },
    legend: { data: ['ももの角度'] },
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
            { yAxis: thresh.center, name: '適正', lineStyle: { color: 'green' } },
            { yAxis: thresh.lower, name: '下限', lineStyle: { color: 'red' } },
          ],
        },
      },
    ],
  };

  return <ReactECharts option={op} style={{ marginTop: '10vw', height: '60vw', backgroundColor: 'white' }} />;
}

export default RealtimeChart;

export function ManuallyAddingChart(props: { data: number[][] }) {
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
