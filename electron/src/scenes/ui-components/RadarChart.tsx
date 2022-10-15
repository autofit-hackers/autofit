import { Card, CardContent, SxProps } from '@mui/material';
import { graphic } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { InstructionItem, InstructionItemResult } from '../../coaching/formInstruction';

export type RadarChartIndicators = { name: string; max: number }[];
export type RadarChartSeries = { name: string; value: number[] }[];

// TODO: 応急処置なので本来は自動改行にすべし
export const escapeHiddenText = (name: string): string => {
  if (name === 'ひざの開き') {
    return '膝の\n開き';
  }

  return name;
};

function RadarChart(props: {
  formInstructionItems: InstructionItem[];
  formEvaluationResults: InstructionItemResult[];
  style: React.CSSProperties;
  sx: SxProps;
}) {
  const { formInstructionItems, formEvaluationResults, style, sx } = props;
  const indicators = formInstructionItems.map((instruction) => ({
    name: escapeHiddenText(instruction.label),
    max: 100,
  }));
  const series = [
    {
      // レーダーチャートの見栄えのため、スコアの最小を20/100とする
      value: formEvaluationResults.map((result) => Math.max(result.totalScore, 20)),
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
      <CardContent sx={sx}>
        <ReactECharts option={option} style={style} />
      </CardContent>
    </Card>
  );
}

export default RadarChart;
