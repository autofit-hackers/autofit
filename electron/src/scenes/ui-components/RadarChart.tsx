import { Card, CardContent } from '@mui/material';
import { graphic } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { FormEvaluationResult, FormInstructionItem } from '../../coaching/formInstructionItems';
import { cardSx } from '../themes';

export type RadarChartIndicators = { name: string; max: number }[];
export type RadarChartSeries = { name: string; value: number[] }[];

// TODO: 応急処置
export const escapeHiddenText = (name: string): string => {
  if (name === 'ひざの開き') {
    return '膝の\n開き';
  }

  return name;
};

function RadarChart(props: {
  formInstructionItems: FormInstructionItem[];
  formEvaluationResults: FormEvaluationResult[];
  style: React.CSSProperties;
}) {
  const { formInstructionItems, formEvaluationResults, style } = props;
  const indicators = formInstructionItems.map((instruction) => ({
    name: escapeHiddenText(instruction.label),
    max: 100,
  }));
  const series = [
    {
      // レーダーチャートの見栄えのため、スコアの最小を20/100とする
      value: formEvaluationResults.map((result) => Math.max(result.score, 20)),
      name: '今回のセット',
    },
  ];
  const legends: string[] = series.map((row) => row.name);
  const option = {
    radar: {
      indicator: indicators,
      axisName: {
        formatter: '{value}',
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

  return (
    <Card>
      <CardContent sx={cardSx}>
        <ReactECharts option={option} style={style} />
      </CardContent>
    </Card>
  );
}

export default RadarChart;
