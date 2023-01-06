import { CardMedia, Stack, Typography } from '@mui/material';

interface TrainerBioCardProps {
  trainerId: string;
}

export default function TrainerBioCard({ trainerId }: TrainerBioCardProps) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ p: 2, alignItems: 'center', backgroundColor: 'rgb(240,240,240)', borderRadius: 2 }}
    >
      <CardMedia
        component="img"
        image="https://entry.fcip-shiken.jp/resources/images/img_photo01.png"
        sx={{ width: '50px', height: '50px', objectFit: 'fit', borderRadius: '25px' }}
      />
      <Stack direction="column">
        <Typography fontSize="small" fontWeight={600}>
          近藤佑亮 トレーナー
        </Typography>
        <Typography fontSize="small" fontWeight={600}>
          東京大学ボディビル＆ウェイトリフティング部
        </Typography>
        <Typography fontSize="small" fontWeight={600}>
          ID: {trainerId}
        </Typography>
      </Stack>
    </Stack>
  );
}
