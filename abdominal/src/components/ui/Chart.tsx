import ReactECharts from 'echarts-for-react';
import { CSSProperties } from 'react';

function Chart(props: { data: number[]; style: CSSProperties }) {
  const { data, style } = props;

  const op = {
    xAxis: {
      type: 'category',
      data: data.map((v, i) => i),
      min: 0,
      max: data.length,
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

export default Chart;
