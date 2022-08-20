import RestoreIcon from '@mui/icons-material/Restore';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { FormInstructionItem } from '../../coaching/formInstructionItems';

type InstructionNavigationProps = {
  selectedInstructionIndex: number;
  setSelectedInstructionIndex: React.Dispatch<React.SetStateAction<number>>;
  formInstructionItems: FormInstructionItem[];
};

function InstructionNavigation(instructionNavigationProps: InstructionNavigationProps) {
  const { selectedInstructionIndex, setSelectedInstructionIndex, formInstructionItems } = instructionNavigationProps;

  return (
    <BottomNavigation
      showLabels
      value={selectedInstructionIndex}
      onChange={(event, newValue: number) => {
        setSelectedInstructionIndex(newValue);
      }}
      sx={{
        mx: 'auto',
        width: '90%',
        '& .Mui-selected': { backgroundColor: '#005555' },
      }}
    >
      {formInstructionItems.map((instructionItem) => (
        <BottomNavigationAction
          key={instructionItem.id}
          label={instructionItem.label}
          icon={<RestoreIcon />}
          value={instructionItem.id}
          sx={{
            backgroundColor: 'grey.900',
            borderRadius: 0,
            border: 1,
            borderColor: 'grey.500',
            borderTop: 0,
            borderTopColor: '#006666',
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 20,
            boxShadow: 0,
            mr: 5,
          }}
        />
      ))}
    </BottomNavigation>
  );
}

export default InstructionNavigation;
