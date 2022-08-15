import ReactECharts from 'echarts-for-react';

export type RadarChartIndicators = { name: string; max: number }[];
export type RadarChartSeries = { name: string; value: number[] }[];
type RadarChartProps = { indicators: RadarChartIndicators; series: RadarChartSeries; style: React.CSSProperties };

function RadarChart(radarChartProps: RadarChartProps) {
  const { indicators, series, style } = radarChartProps;
  console.log('series', series);
  const legends: string[] = series.map((row) => row.name);
  const option = {
    title: {
      text: 'Training Performance',
    },
    tooltip: {},
    legend: {
      data: legends,
    },
    radar: {
      indicator: indicators,
    },
    series: [
      {
        name: legends.join(' vs. '),
        type: 'radar',
        data: series,
      },
    ],
  };

  return <ReactECharts option={option} style={style} />;
}

export default RadarChart;
