import SaveAsIcon from '@mui/icons-material/SaveAs';
import { IconButton } from '@mui/material';
import type { Set } from '@/training_data/set';
import saveExercise from '../handlers/save-exercise';

function SaveButton(props: { set: Set }) {
  const { set } = props;

  return (
    <IconButton onClick={() => saveExercise(set)}>
      <SaveAsIcon />
    </IconButton>
  );
}

export default SaveButton;
