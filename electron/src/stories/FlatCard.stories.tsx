import { ComponentMeta, ComponentStory } from '@storybook/react';
import FlatButton from './FlatButton';

import FlatCard from './FlatCard';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'autofit/Card/FlatCard',
  component: FlatCard,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof FlatCard>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof FlatCard> = (args) => <FlatCard {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  onClick: () => {
    console.log('clicked');
  },
  children: (
    <FlatButton
      label="button"
      onClick={() => {
        console.log('happy');
      }}
    />
  ),
};
