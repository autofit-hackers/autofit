import ReactECharts from 'echarts-for-react';

function RealtimeChart(props: { data: number[]; bar: number[]; thresh: number }) {
  const { data, bar, thresh } = props;

  const op = {
    innerHeight: '100vh',
    xAxis: {
      type: 'category',
      data: data.map((v, i) => i),
      min: data.length - 51,
      max: data.length - 1,
    },
    yAxis: {
      type: 'value',
      min: thresh,
      max: thresh + 60,
    },
    legend: { data: ['ももの角度', '足の角度'] },
    series: [
      {
        name: 'ももの角度',
        data,
        type: 'line',
        itemStyle: { normal: { color: 'blue' } },
        smooth: true,
        markLine: {
          data: [
            { yAxis: 40 + thresh, name: '上限', lineStyle: { color: 'red' } },
            { yAxis: 20 + thresh, name: '適正', lineStyle: { color: 'green' } },
            { yAxis: 10 + thresh, name: '下限', lineStyle: { color: 'red' } },
          ],
        },
      },
      {
        name: '足の角度',
        data: bar,
        type: 'line',
      },
    ],
  };

  return <ReactECharts option={op} style={{ marginTop: 10 }} />;
}

export default RealtimeChart;
