import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CheckResult } from '../coaching/formEvaluation';
import ResultPageForTrainer from './ResultPageForTrainer';

export default {
  title: 'autofit/Page/ResultPageForTrainer',
  component: ResultPageForTrainer,
} as ComponentMeta<typeof ResultPageForTrainer>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof ResultPageForTrainer> = (args) => <ResultPageForTrainer {...args} />;

export const Primary = Template.bind({});

const results: CheckResult[] = [
  {
    nameEN: 'Squat depth',
    nameJP: 'しゃがむ深さ',
    isGood: true,
    description: '少し浅いですが、問題ありません。',
    scoreForSet: 90,
    worstRepIndex: 0,
    eachRepErrors: [{ errorScores: 1, coordinateError: 0 }],
  },
  {
    nameEN: 'Knee front and back',
    nameJP: '姿勢',
    isGood: false,
    description: 'ひざが前に出ています',
    scoreForSet: 50,
    worstRepIndex: 0,
    eachRepErrors: [{ errorScores: 1, coordinateError: 0 }],
  },
  {
    nameEN: 'Velocity',
    nameJP: '速度',
    isGood: true,
    description: '少し速いですが、問題ありません。',
    scoreForSet: 60,
    worstRepIndex: 0,
    eachRepErrors: [{ errorScores: 1, coordinateError: 0 }],
  },
];

Primary.args = {
  videoUrl: 'https://www.youtube.com/watch?v=Q8TXgCzxEnw',
  summaryDescription: '今回のトレーニング結果は、ひざの開きが50%、背筋の張りが50%でした。',
  results,
  handleBack: action('back'),
  handleForward: action('forward'),
};
