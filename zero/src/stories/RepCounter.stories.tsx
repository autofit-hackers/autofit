import { ComponentMeta, ComponentStory } from '@storybook/react';
import RepCounter from './RepCounter';

export default {
  title: 'autofit/Card/RepCounter',
  component: RepCounter,
} as ComponentMeta<typeof RepCounter>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof RepCounter> = (args) => <RepCounter {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  currentCount: 3,
  targetCount: 8,
};
