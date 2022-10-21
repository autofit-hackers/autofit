import { ComponentMeta, ComponentStory } from '@storybook/react';

import CheckboxWithText from './CheckboxWithText';

export default {
  title: 'autofit/Checkbox/CheckboxWithText',
  component: CheckboxWithText,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof CheckboxWithText>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof CheckboxWithText> = (args) => <CheckboxWithText {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  text: 'Checkbox',
  isChecked: false,
  checkboxSx: {},
  textSx: {},
};
