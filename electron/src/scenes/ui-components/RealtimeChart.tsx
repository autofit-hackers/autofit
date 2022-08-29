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
            { yAxis: thresh.upper, name: '上限', lineStyle: { color: 'red' } },
            { yAxis: thresh.center, name: '適正', lineStyle: { color: 'green' } },
            { yAxis: thresh.lower, name: '下限', lineStyle: { color: 'red' } },
          ],
        },
      },
    ],
  };

  return <ReactECharts option={op} style={{ marginTop: 10, height: '60vw', backgroundColor: 'white' }} />;
}

export default RealtimeChart;
