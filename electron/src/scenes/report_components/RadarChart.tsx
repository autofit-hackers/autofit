import ReactECharts from 'echarts-for-react';

export type RadarChartIndicators = { name: string; max: number }[];
export type RadarChartSeries = { name: string; value: number[] }[];
type RadarChartProps = { indicators: RadarChartIndicators; series: RadarChartSeries; style: React.CSSProperties };

function RadarChart(radarChartProps: RadarChartProps) {
  const { indicators, series, style } = radarChartProps;
  const legends: string[] = series.map((row) => row.name);
  const option = {
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
