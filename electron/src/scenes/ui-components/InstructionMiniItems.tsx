import ErrorIcon from '@mui/icons-material/Error';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { FormEvaluationResult } from '../../training_data/set';

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
  color: '#000000' | '#0000ff';
}) {
  const { isGood, description, itemIndex, setSelectedInstructionIndex, color } = props;

  return (
    <Card>
      <CardActionArea
        onClick={() => {
          setSelectedInstructionIndex(itemIndex);
        }}
      >
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Stack direction="row">
            <GoodChip isGood={isGood} />
          </Stack>
          <Typography color={color}>{description}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function InstructionItems(props: {
  formEvaluationResults: FormEvaluationResult[];
  selectedInstructionIndex: number;
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { formEvaluationResults, selectedInstructionIndex, setSelectedInstructionIndex } = props;

  return (
    <Stack spacing={3}>
      {formEvaluationResults.map((formEvaluationResult, itemIndex) => (
        <InstructionItem
          isGood={false}
          description={formEvaluationResult.descriptionsForEachRep[0]}
          itemIndex={itemIndex}
          setSelectedInstructionIndex={setSelectedInstructionIndex}
          color={selectedInstructionIndex === itemIndex ? '#0000ff' : '#000000'}
        />
      ))}
    </Stack>
  );
}

export default InstructionItems;
