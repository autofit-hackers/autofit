import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import ResultDetailModal from './ResultDetailModal';

export default {
  title: 'autofit/Modal/ResultDetailModal',
  component: ResultDetailModal,
} as ComponentMeta<typeof ResultDetailModal>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof ResultDetailModal> = (args) => <ResultDetailModal {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  checkpointName: 'チェックポイント名',
  open: true,
  description: 'ひざの開き',
  handleClose: action('closed'),
};
