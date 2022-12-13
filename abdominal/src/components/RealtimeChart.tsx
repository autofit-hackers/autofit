import ReactECharts from 'echarts-for-react';

function RealtimeChart(props: { data: number[] }) {
  const { data } = props;

  const op = {
    // innerHeight: '100vh',
    xAxis: {
      type: 'category',
      data: data.map((v, i) => i),
      // 最新300個のデータを表示する
      min: data.length - 301,
      max: data.length - 1,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'height',
        data,
        type: 'line',
        itemStyle: { normal: { color: 'blue' } },
        smooth: true,
      },
    ],
  };

  return <ReactECharts option={op} style={{ marginTop: '10vw', height: '50vw' }} />;
}

export default RealtimeChart;
