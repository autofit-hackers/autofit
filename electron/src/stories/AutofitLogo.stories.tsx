import { ComponentMeta, ComponentStory } from '@storybook/react';
import AutofitLogo from './AutofitLogo';

export default {
  title: 'autofit/Animation/AutofitLogo',
  component: AutofitLogo,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'fullscreen',
  },
} as ComponentMeta<typeof AutofitLogo>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof AutofitLogo> = () => <AutofitLogo scale={1} style={{}} />;

export const Animation = Template.bind({});
