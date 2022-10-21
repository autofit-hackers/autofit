import { ComponentMeta, ComponentStory } from '@storybook/react';
import AutofitLogo from './AutofitLogo';

export default {
  title: 'autofit/Animation/AutofitLogo',
  component: AutofitLogo,
  parameters: {
    layout: 'fullscreen',
  },
} as ComponentMeta<typeof AutofitLogo>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof AutofitLogo> = () => <AutofitLogo scale={1} style={{}} />;

export const Animation = Template.bind({});
