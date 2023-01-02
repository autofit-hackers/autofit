import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { CardMedia, IconButton, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import TrainerBioCard from '../0_parts/TrainerBioCard';
import TrainingLogList from '../1_templates/TrainingLogList';

export default function Detail() {
  return (
    <Stack spacing={1} sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <IconButton size="small" component={Link} to="/">
          <ArrowBackIosIcon />
        </IconButton>
        <Typography fontWeight={600}>トレーニングの感想</Typography>
      </Stack>
      <Typography fontWeight={600}>ハイライト動画</Typography>
      <CardMedia
        component="video"
        src="https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4"
        autoPlay
        controls
        muted
        sx={{ width: '100%', objectFit: 'contain' }}
      />
      <Typography fontWeight={600}>トレーナーからのコメント</Typography>
      <Typography fontSize="small">
        上野さんは左右のバランスが微妙かもしれません。立ち上がる際に若干お尻が右から左にスライドしています。右の股関節の可動域が狭い可能性があります。こちらの動画を見てみてください。
      </Typography>
      <TrainerBioCard />
      <Typography fontWeight={600}>トレーニング記録</Typography>
      <TrainingLogList />
    </Stack>
  );
}
