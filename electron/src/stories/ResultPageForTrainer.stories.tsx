import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import ResultPageForTrainer from './ResultPageForTrainer';

export default {
  title: 'autofit/Page/ResultPageForTrainer',
  component: ResultPageForTrainer,
} as ComponentMeta<typeof ResultPageForTrainer>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof ResultPageForTrainer> = (args) => <ResultPageForTrainer {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  videoUrl: 'https://www.youtube.com/watch?v=Q8TXgCzxEnw',
  summaryDescription: '今回のトレーニング結果は、ひざの開きが50%、背筋の張りが50%でした。',
  handleBack: action('back'),
  handleForward: action('forward'),
};
