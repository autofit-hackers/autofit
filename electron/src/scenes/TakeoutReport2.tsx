import { Box, Grid } from '@mui/material';
import { Container } from '@mui/system';
import { useAtom } from 'jotai';
import autofitLogo from '../../resources/images/autofit-logo.png';
import { formInstructionItemsAtom, setRecordAtom } from './atoms';
import InstructionItemExpression from './ui-components/InstructionItemExpression';

export default function TakeoutReport2() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);

  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        backgroundColor: 'white',
        flexGrow: 1,
        height: '141vw',
        overflow: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'right', height: '100px', mb: '20px' }}>
          {/* autofitのロゴ */}
          <img src={autofitLogo} alt="autofit" />
        </Box>
        <Grid container spacing={2}>
          {formInstructionItems.slice(0, 3).map((item, index) => (
            <Grid item xs={12}>
              <InstructionItemExpression
                title={item.label}
                image={item.image}
                imagePosition={index % 2 === 0 ? 'left' : 'right'}
                isGood={setRecord.formEvaluationResults[index].isGood}
                fixedDescription={item.fixedDescription}
                resultDescription={setRecord.formEvaluationResults[index].shortSummary}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
