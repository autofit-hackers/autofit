import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import FlatButton from './FlatButton';

import FlatCard from './FlatCard';

export default {
  title: 'autofit/Card/FlatCard',
  component: FlatCard,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof FlatCard>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
export const Template: ComponentStory<typeof FlatCard> = (args) => <FlatCard {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  onClick: () => {
    action('clicked');
  },
  children: (
    <FlatButton
      label="button"
      onClick={() => {
        action('happy');
      }}
    />
  ),
};
