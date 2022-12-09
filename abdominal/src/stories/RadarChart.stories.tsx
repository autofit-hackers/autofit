import { ComponentMeta, ComponentStory } from '@storybook/react';
import RadarChart from './RadarChart';

export default {
  title: 'autofit/Chart/RadarChart',
  component: RadarChart,
} as ComponentMeta<typeof RadarChart>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof RadarChart> = (args) => <RadarChart {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  radarChartItems: [
    {
      name: 'ひざの開き',
      value: 50,
    },
    {
      name: '背筋の張り',
      value: 50,
    },
    {
      name: '腰の張り',
      value: 50,
    },
    {
      name: '腕の開き',
      value: 50,
    },
    {
      name: '腕の張り',
      value: 50,
    },
    {
      name: '腕の上げ下げ',
      value: 50,
    },
  ],
  onClick: {
    click(params: { name: string }) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(params.name)}`);
    },
  },
};
