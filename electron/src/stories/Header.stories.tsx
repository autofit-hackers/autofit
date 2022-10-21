import { ComponentMeta, ComponentStory } from '@storybook/react';
import Header from './Header';

export default {
  title: 'autofit/Card/Header',
  component: Header,
  argTypes: {
    title: { control: 'text' },
  },
} as ComponentMeta<typeof Header>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof Header> = (args) => <Header {...args} />;

export const Result = Template.bind({});

Result.args = {
  title: '今回のトレーニング結果',
};
