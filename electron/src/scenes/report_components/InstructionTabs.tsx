import { Tab, Tabs } from '@mui/material';
import { FormInstructionItem } from '../../coaching/formInstructionItems';

function InstructionTabs(props: {
  selectedInstructionIndex: number;
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
  formInstructionItems: FormInstructionItem[];
}) {
  const { selectedInstructionIndex, setSelectedInstructionIndex, formInstructionItems } = props;

  return (
    <Tabs
      value={selectedInstructionIndex}
      onChange={(event, newValue: number) => {
        setSelectedInstructionIndex(newValue);
      }}
      textColor="secondary"
      indicatorColor="secondary"
      aria-label="secondary tabs example"
      orientation="vertical"
    >
      {formInstructionItems.map((instructionItem) => (
        <Tab key={instructionItem.id} label={instructionItem.label} value={instructionItem.id} sx={{}} />
      ))}
    </Tabs>
  );
}

export default InstructionTabs;
