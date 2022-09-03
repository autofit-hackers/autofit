import { Box, CssBaseline } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import autofitLogo from '../../resources/images/autofit-logo.png';
import { formInstructionItemsAtom, setRecordAtom } from './atoms';
import futuristicTheme from './themes';
import InstructionItemExpression from './ui-components/InstructionItemExpression';

export default function TakeoutReport3() {
  // セット記録用
  const [setRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);

  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          display: 'flex',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* autofitのロゴ */}
            <img src={autofitLogo} alt="autofit" width="100" height="100" />
          </Box>
        </Container>
        {formInstructionItems.slice(3).map((item, index) => (
          <InstructionItemExpression
            title={item.label}
            image={item.image}
            isGood={setRecord.formEvaluationResults[index].isGood}
            fixedDescription={item.fixedDescription}
            resultDescription={setRecord.formEvaluationResults[index].shortSummary}
          />
        ))}
      </Box>
    </ThemeProvider>
  );
}
