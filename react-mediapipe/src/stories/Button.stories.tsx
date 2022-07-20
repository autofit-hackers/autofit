import { Button, ButtonProps } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import theme from './theme';

export default {
  title: 'Example/Button',
  component: Button,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = function (args) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Button {...args} />;
};

export const Primary = Template.bind({});
const primaryProps: ButtonProps = {
  color: 'primary',
  variant: 'contained',
  children: 'test',
};
Primary.args = primaryProps;
