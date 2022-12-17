import ReactECharts from 'echarts-for-react';
import { CSSProperties } from 'react';

function RealtimeChart(props: { data: number[]; style: CSSProperties }) {
  const { data, style } = props;

  const op = {
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

  return <ReactECharts option={op} style={style} />;
}

export default RealtimeChart;
