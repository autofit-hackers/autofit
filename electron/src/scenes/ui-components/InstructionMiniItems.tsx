import ErrorIcon from '@mui/icons-material/Error';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { FormEvaluationResult } from '../../training_data/set';

function GoodChip(props: { isGood: boolean }) {
  const { isGood } = props;

  const goodChip = <Chip label="Good" color="secondary" icon={<ThumbUpAltIcon fontSize="small" />} sx={{ mb: 1 }} />;
  const badChip = <Chip label="Bad" color="primary" icon={<ErrorIcon fontSize="small" />} sx={{ mb: 1 }} />;

  return isGood ? goodChip : badChip;
}

function InstructionItem(props: {
  isGood: boolean;
  description: string;
  itemIndex: number;
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
  isSelected: boolean;
}) {
  const { isGood, description, itemIndex, setSelectedInstructionIndex, isSelected } = props;

  return (
    <Card>
      <CardActionArea
        onClick={() => {
          setSelectedInstructionIndex(itemIndex);
        }}
      >
        <CardContent sx={{ flex: '1 0 auto' }} style={{ backgroundColor: isSelected ? '#5555ff' : '#ffffff' }}>
          <Stack direction="row">
            <GoodChip isGood={isGood} />
          </Stack>
          <Typography color={isSelected ? '#ffffff' : '0000ff'}>{description}</Typography>
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
          // FIXME: logic and threshold
          isGood={formEvaluationResult.score > 50}
          // FIXME: [0] ではなく Result.descriptionForSet を追加して使用
          description={formEvaluationResult.descriptionsForEachRep[0]}
          itemIndex={itemIndex}
          setSelectedInstructionIndex={setSelectedInstructionIndex}
          isSelected={selectedInstructionIndex === itemIndex}
        />
      ))}
    </Stack>
  );
}

export default InstructionItems;
