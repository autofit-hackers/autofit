import ReactECharts from 'echarts-for-react';

function RealtimeChart(props: { data: number[]; bar: number[] }) {
  const { data, bar } = props;

  const op = {
    xAxis: {
      type: 'category',
      data: data.map((v, i) => i),
      min: data.length - 51,
      max: data.length - 1,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 180,
    },
    legend: { data: ['hiza', 'ashi'] },
    series: [
      {
        name: 'hiza',
        data,
        type: 'line',
        itemStyle: { normal: { color: 'red' } },
      },
      {
        name: 'ashi',
        data: bar,
        type: 'line',
      },
    ],
  };

  return <ReactECharts option={op} style={{ marginTop: 10 }} />;
}

export default RealtimeChart;
