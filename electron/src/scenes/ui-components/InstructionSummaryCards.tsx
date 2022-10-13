import ErrorIcon from '@mui/icons-material/Error';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import { Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { SetEvaluationResult } from '../../coaching/formInstruction';

export function GoodChip(props: { isGood: boolean }) {
  const { isGood } = props;

  const goodChip = <Chip label="Good" color="success" icon={<ThumbUpAltIcon fontSize="small" />} sx={{ mb: 1 }} />;
  const badChip = <Chip label="Bad" color="error" icon={<ErrorIcon fontSize="small" />} sx={{ mb: 1 }} />;

  return isGood ? goodChip : badChip;
}

// TODO: resolve key missing warning
function InstructionSummaryCard(props: {
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

function InstructionSummaryCards(props: {
  formEvaluationResults: SetEvaluationResult[];
  selectedInstructionIndex: number;
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { formEvaluationResults, selectedInstructionIndex, setSelectedInstructionIndex } = props;

  return (
    <Stack spacing={3}>
      {formEvaluationResults.map((formEvaluationResult, itemIndex) => (
        <InstructionSummaryCard
          isGood={formEvaluationResult.isGood}
          description={formEvaluationResult.description.short}
          itemIndex={itemIndex}
          setSelectedInstructionIndex={setSelectedInstructionIndex}
          isSelected={selectedInstructionIndex === itemIndex}
        />
      ))}
    </Stack>
  );
}

export default InstructionSummaryCards;
