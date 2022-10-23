import { graphic } from 'echarts';
import ReactECharts from 'echarts-for-react';

type RadarChartItem = { name: string; value: number };

interface RadarChartProps {
  radarChartItems: RadarChartItem[];
  onClick: { click(params: { name: string }): void };
}

export default function RadarChart({ radarChartItems, onClick }: RadarChartProps) {
  // グラフエリアの定義
  const indicators = radarChartItems.map((item) => ({ name: item.name, max: 100 }));
  // 軸の定義
  const legends: string[] = radarChartItems.map((item) => item.name);
  // データの定義
  const data = [
    {
      value: radarChartItems.map((item) => item.value),
      name: '今回のセット',
    },
  ];
  // 描画情報の定義
  const option = {
    radar: {
      indicator: indicators,
      axisName: {
        formatter: '{value}',
        color: '#428BD4',
      },
      triggerEvent: true,
    },
    series: [
      {
        name: legends.join(' vs. '),
        type: 'radar',
        data,
        areaStyle: {
          color: new graphic.RadialGradient(0.1, 0.6, 1, [
            {
              color: 'rgba(0, 145, 124, 0.1)',
              offset: 0,
            },
            {
              color: 'rgba(0, 145, 124, 0.9)',
              offset: 1,
            },
          ]),
        },
      },
    ],
  };

  return <ReactECharts option={option} onEvents={onClick} />;
}
