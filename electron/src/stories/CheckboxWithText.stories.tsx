import { ComponentMeta, ComponentStory } from '@storybook/react';

import CheckboxWithText from './CheckboxWithText';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'autofit/Checkbox/CheckboxWithText',
  component: CheckboxWithText,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof CheckboxWithText>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof CheckboxWithText> = (args) => <CheckboxWithText {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  text: 'Checkbox',
  isChecked: false,
  checkboxSx: {},
  textSx: {},
};
