import { ComponentMeta, ComponentStory } from '@storybook/react';
import PreSetAlertModal from './PreSetAlertModal';

export default {
  title: 'autofit/Card/PreSetAlertModal',
  component: PreSetAlertModal,
} as ComponentMeta<typeof PreSetAlertModal>;

// eslint-disable-next-line react/function-component-definition, react/jsx-props-no-spreading
const Template: ComponentStory<typeof PreSetAlertModal> = (args) => <PreSetAlertModal {...args} />;

export const Primary = Template.bind({});

Primary.args = {
  description: 'バーベルを担いで開始しましょう！',
  open: true,
  onClose: () => {
    console.log('closed');
  },
};
