import ErrorIcon from '@mui/icons-material/Error';
import StartIcon from '@mui/icons-material/Start';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { Chip, IconButton, Paper, Stack, Typography } from '@mui/material';
import { FormEvaluationResult } from '../../training_data/set';
import { paperSx } from '../themes';

function GoodChip(props: { isGood: boolean }) {
  const { isGood } = props;

  const goodChip = <Chip label="Good" color="secondary" icon={<ThumbUpAltIcon fontSize="small" />} />;
  const badChip = <Chip label="Bad" color="primary" icon={<ErrorIcon fontSize="small" />} />;

  return isGood ? goodChip : badChip;
}

function InstructionItem(props: {
  isGood: boolean;
  description: string;
  itemIndex: number;
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { isGood, description, itemIndex, setSelectedInstructionIndex } = props;

  return (
    <Paper sx={paperSx}>
      <Stack direction="row">
        <GoodChip isGood={isGood} />
      </Stack>
      <Stack direction="row" justifyContent="space-around">
        <Typography>{description}</Typography>
        <IconButton
          onClick={() => {
            setSelectedInstructionIndex(itemIndex);
          }}
        >
          <StartIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
}

function InstructionItems(props: {
  formEvaluationResults: FormEvaluationResult[];
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { formEvaluationResults, setSelectedInstructionIndex } = props;

  return (
    <Stack spacing={3}>
      {formEvaluationResults.map((formEvaluationResult, itemIndex) => (
        <InstructionItem
          isGood={false}
          description={formEvaluationResult.descriptionsForEachRep[0]}
          itemIndex={itemIndex}
          setSelectedInstructionIndex={setSelectedInstructionIndex}
        />
      ))}
    </Stack>
  );
}

export default InstructionItems;
