import { Box, Card, Grid, Stack, Typography } from '@mui/material';
import { Container } from '@mui/system';
import { useAtom } from 'jotai';
import autofitHPQR from '../../resources/images/autofit-hp-qr.png';
import autofitLogo from '../../resources/images/autofit-logo.png';
import { formInstructionItemsAtom, setRecordAtom } from './atoms';
import InstructionItemExpression from './ui-components/InstructionItemExpression';

export default function TakeoutReport3() {
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
          {formInstructionItems.slice(3).map((item, index) => (
            <Grid item xs={12}>
              {/* 1枚目に表示させた3項目分だけindexを変化させる */}
              <InstructionItemExpression
                title={item.label}
                image={item.image}
                imagePosition={index % 2 === 0 ? 'left' : 'right'}
                isGood={setRecord.formEvaluationResults[index + 3].isGood}
                fixedDescription={item.fixedDescription}
                resultDescription={setRecord.formEvaluationResults[index + 3].shortSummary}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Card
              sx={{
                display: 'flex',
                borderRadius: 5,
                borderWidth: 2,
                boxShadow: 0,
                alignItems: 'center',
                height: '35vw',
              }}
            >
              {/* autofit HP の QR Code */}
              <img src={autofitHPQR} alt="autofit" />
              <Stack spacing={2}>
                <Typography gutterBottom variant="h5" component="div" fontWeight="bold">
                  お問い合わせフォーム
                </Typography>
                <Typography variant="body1" color="text.primary" fontWeight="500">
                  autofit はデータの力を駆使して
                  、誰もが簡単にフリーウェイトをマスターしてマッチョになれる世界の実現を目指しています。
                  本レポートへのご意見・ご感想はもちろん、
                  実証実験や指導アルゴリズムの改善にご協力いただけるトレーナーやジム経営者の方、共にプロダクトを開発するエンジニアの方、ご連絡をお待ちしております。
                </Typography>
                <Typography variant="body1" color="text.primary" fontWeight="600">
                  mail: info@autofit.co.jp
                </Typography>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
