import { CardMedia, Typography } from '@mui/material';
import { Stack } from '@mui/system';

export default function SummaryCommentCard() {
  return (
    <Stack direction="row" spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
      <CardMedia
        component="img"
        image="https://entry.fcip-shiken.jp/resources/images/img_photo01.png"
        sx={{ width: '60px', height: '60px', objectFit: 'fit', borderRadius: '30px' }}
      />
      <Typography fontWeight={600}>トレーニングの感想</Typography>
    </Stack>
  );
}
