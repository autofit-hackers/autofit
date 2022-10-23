import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import TextWithIcon from './TextWithIcon';

export default {
  title: 'autofit/Icon/TextWithIcon',
  component: TextWithIcon,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof TextWithIcon>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof TextWithIcon> = (args) => <TextWithIcon {...args} />;

export const Primary = Template.bind({});
Primary.args = { icon: <AccessTimeIcon sx={{ fontSize: 60 }} color="primary" />, text: '時間' };
