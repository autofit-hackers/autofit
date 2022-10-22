import { ComponentMeta, ComponentStory } from '@storybook/react';

import CountdownCircles from './CountdownCircles';

export default {
  title: 'autofit/Timer/CountdownCircles',
  component: CountdownCircles,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof CountdownCircles>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof CountdownCircles> = (args) => <CountdownCircles {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  key: 1,
  isPlaying: true,
  duration: 10,
  onComplete: () => {
    console.log('completed');
  },
};
