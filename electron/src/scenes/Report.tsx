import RestoreIcon from '@mui/icons-material/Restore';
import { BottomNavigation, BottomNavigationAction, Box, createTheme, CssBaseline, Grid, Paper } from '@mui/material';
import { Container, ThemeProvider } from '@mui/system';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { recordFromEvaluationResult } from '../coaching/formInstruction';
import { formInstructionItemsAtom, setRecordAtom } from './atoms';
import { GoodPoint, VideoReplayer } from './ReportComponents';

export default function IntervalReport() {
  const [setRecord, setSetRecord] = useAtom(setRecordAtom);
  const [formInstructionItems] = useAtom(formInstructionItemsAtom);
  const [selectedInstructionIndex, setSelectedInstructionIndex] = useState(0);
  const displayedRepIndex = setRecord.formEvaluationResults[selectedInstructionIndex].worstRepIndex;

  // Reportコンポーネントマウント時にセット変数にフォーム分析結果を記録する
  useEffect(() => {
    setSetRecord(recordFromEvaluationResult(setRecord, formInstructionItems));
  }, [formInstructionItems, setRecord, setSetRecord]);

  const futuristicTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#00ffff',
        dark: '#00ffff',
        contrastText: '#fff',
      },
      secondary: {
        main: '#00ffff',
        dark: '#ba000d',
        contrastText: '#000',
      },
    },
  });

  return (
    <ThemeProvider theme={futuristicTheme}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: 1920,
          width: 1080,
          overflow: 'auto',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing="1vh">
            {/* 撮影したRGB映像 */}
            <VideoReplayer displayedRepIndex={displayedRepIndex} />
            {/* トレーニングの3D表示 */}
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '98vw',
                }}
              />
            </Grid>
            <GoodPoint text={formInstructionItems[selectedInstructionIndex].text ?? 'null'} />
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
              {/* TODO: コンポーネントのマウント時にタブが表示されない問題を解決する。おそらくselectedをindex0でtrueに設定すればよい。 */}
              {formInstructionItems.map((instructionItem) => (
                <BottomNavigationAction
                  label={instructionItem.label}
                  icon={<RestoreIcon />}
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

            {/* 詳細表示する指導の切り替えボタン類 */}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
