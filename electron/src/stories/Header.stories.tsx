import { ComponentMeta, ComponentStory } from '@storybook/react';
import Header from './Header';

export default {
  title: 'autofit/Card/Header',
  component: Header,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Header>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof Header> = () => <Header />;

export const Primary = Template.bind({});
