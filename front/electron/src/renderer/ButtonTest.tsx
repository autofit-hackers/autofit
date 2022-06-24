import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const MyButton = styled(Button)({
  backgroundColor: 'red',
  '&:hover': {
    backgroundColor: 'red',
  },
});

const MyBtn = () => {
  return <MyButton variant="contained">ボタン</MyButton>;
};

export default MyBtn;
