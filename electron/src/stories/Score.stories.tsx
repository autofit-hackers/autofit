import { ComponentMeta, ComponentStory } from '@storybook/react';
import Score from './Score';

export default {
  title: 'autofit/Object/Score',
  component: Score,
} as ComponentMeta<typeof Score>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof Score> = (args) => <Score {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  value: 90,
};
