import { ComponentMeta, ComponentStory } from '@storybook/react';

import FlatButton from './FlatButton';

export default {
  title: 'autofit/Button/FlatButton',
  component: FlatButton,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof FlatButton>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof FlatButton> = (args) => <FlatButton {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  label: 'Button',
  onClick: () => {
    console.log('clicked');
  },
  sx: {},
};
