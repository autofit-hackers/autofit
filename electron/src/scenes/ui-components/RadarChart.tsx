import { Paper } from '@mui/material';
import { graphic } from 'echarts';
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
      axisName: {
        formatter: '【{value}】',
        color: '#428BD4',
      },
    },
    series: [
      {
        name: legends.join(' vs. '),
        type: 'radar',
        data: series,
        areaStyle: {
          color: new graphic.RadialGradient(0.1, 0.6, 1, [
            {
              color: 'rgba(255, 145, 124, 0.1)',
              offset: 0,
            },
            {
              color: 'rgba(255, 145, 124, 0.9)',
              offset: 1,
            },
          ]),
        },
      },
    ],
  };

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        height: '100%',
        width: '100%',
        borderColor: 'grey.500',
        borderRadius: 5,
        boxShadow: 0,
        backgroundColor: 'white',
      }}
    >
      <ReactECharts option={option} style={style} />
    </Paper>
  );
}

export default RadarChart;
